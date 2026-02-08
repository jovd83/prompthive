import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";

// Helper for backup (server-side only)
function getFileAsBase64(urlPath: string | null): { data: string; type: string } | null {
    if (!urlPath) return null;
    try {
        const relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        const fullPath = path.join(process.cwd(), "public", relativePath);
        if (existsSync(fullPath)) {
            const fileBuffer = readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase().substring(1);
            let mimeType = "application/octet-stream";
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) mimeType = `image/${ext}`;
            return {
                data: fileBuffer.toString('base64'),
                type: mimeType
            };
        }
    } catch (e) {
        // Ignore missing files
    }
    return null;
}

export async function saveSettingsService(userId: string, data: any) {
    return prisma.settings.upsert({
        where: { userId: userId },
        update: {
            autoBackupEnabled: data.autoBackupEnabled,
            backupPath: data.backupPath,
            backupFrequency: data.backupFrequency,
        },
        create: {
            userId: userId,
            autoBackupEnabled: data.autoBackupEnabled,
            backupPath: data.backupPath,
            backupFrequency: data.backupFrequency,
        },
    });
}

export async function performBackupService(userId: string, backupPath: string) {
    try {
        const collections = await prisma.collection.findMany({ where: { ownerId: userId } });
        const prompts = await prisma.prompt.findMany({
            where: { createdById: userId },
            include: {
                versions: {
                    include: { attachments: true }
                },
                tags: true
            },
        });
        const tags = await prisma.tag.findMany();
        const settings = await prisma.settings.findUnique({ where: { userId } });

        // Transform prompts to include base64 files
        const richPrompts = prompts.map(p => ({
            ...p,
            versions: p.versions.map(v => ({
                ...v,
                resultImageFile: getFileAsBase64(v.resultImage),
                attachments: v.attachments.map(a => ({
                    ...a,
                    file: getFileAsBase64(a.filePath)
                }))
            }))
        }));

        const backupData = {
            timestamp: new Date().toISOString(),
            userId,
            collections,
            prompts: richPrompts,
            tags,
            settings
        };

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${timestamp}_prompthive_autobackup.json`;
        const fullPath = path.join(backupPath, filename);

        await fs.mkdir(backupPath, { recursive: true });
        await fs.writeFile(fullPath, JSON.stringify(backupData, null, 2));

        console.log(`Backup saved to ${fullPath}`);
        return true;
    } catch (error) {
        console.error("Backup failed:", error);
        return false;
    }
}

export async function dropAllDataService(userId: string) {
    // 0. Dependent Relations
    await prisma.favorite.deleteMany({});
    await prisma.workflowStep.deleteMany({});
    await prisma.workflow.deleteMany({});

    // 1. Attachments/Versions/Prompts
    await prisma.promptVersion.deleteMany({});
    await prisma.prompt.deleteMany({});

    // 2. Collections
    await prisma.collection.updateMany({
        data: { parentId: null }
    });
    await prisma.collection.deleteMany({});

    // 3. Tags
    await prisma.tag.deleteMany({});
}

export async function restoreLatestBackupService(userId: string, backupPath: string) {
    let files;
    try {
        files = await fs.readdir(backupPath);
    } catch (e) {
        throw new Error("Could not access backup directory.");
    }

    const backupFiles = files
        .filter(f => f.endsWith('_prompthive_autobackup.json'))
        .sort()
        .reverse();

    if (backupFiles.length === 0) throw new Error("No backup files found.");

    const latestFile = backupFiles[0];
    const fullPath = path.join(backupPath, latestFile);

    const content = await fs.readFile(fullPath, 'utf-8');
    const backupData = JSON.parse(content);

    if (backupData.userId !== userId) throw new Error("Backup does not belong to this user.");

    await dropAllDataService(userId);

    // Reuse logic roughly from importPromptsService but specifically for backup structure
    // Actually, logic is identical to actions.ts restoreLatestBackup
    // Since I can't reuse logic across files easily without circular deps or utils, I'll copy-paste logic here.

    // Restore Collections
    const collectionIdMap: Record<string, string> = {};

    for (const col of backupData.collections) {
        const newCol = await prisma.collection.create({
            data: {
                title: col.title,
                description: col.description,
                ownerId: userId,
            }
        });
        collectionIdMap[col.id] = newCol.id;
    }

    for (const col of backupData.collections) {
        if (col.parentId && collectionIdMap[col.parentId]) {
            await prisma.collection.update({
                where: { id: collectionIdMap[col.id] },
                data: { parentId: collectionIdMap[col.parentId] }
            });
        }
    }

    // Restore Prompts
    for (const p of backupData.prompts) {
        const tagIds = [];
        if (p.tags) {
            for (const tag of p.tags) {
                let existingTag = await prisma.tag.findUnique({ where: { name: tag.name } });
                if (!existingTag) {
                    existingTag = await prisma.tag.create({ data: { name: tag.name } });
                }
                tagIds.push(existingTag.id);
            }
        }

        const newPrompt = await prisma.prompt.create({
            data: {
                title: p.title,
                description: p.description,
                createdById: userId,
                tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
                viewCount: p.viewCount,
                copyCount: p.copyCount,
                versions: {
                    create: await Promise.all(p.versions.map(async (v: any) => {
                        // Restore Image Helper
                        let resultImagePath = v.resultImage;
                        if (v.resultImageFile && v.resultImageFile.data) {
                            try {
                                const buffer = Buffer.from(v.resultImageFile.data, 'base64');
                                const ext = v.resultImage ? path.extname(v.resultImage) : '.png';
                                const fileName = `restored-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
                                const uploadDir = path.join(process.cwd(), "public", "uploads");
                                await fs.mkdir(uploadDir, { recursive: true });
                                await fs.writeFile(path.join(uploadDir, fileName), buffer);
                                resultImagePath = `/uploads/${fileName}`;
                            } catch (e) { console.error("Failed to restore image", e); }
                        }

                        const restoredAttachments = [];
                        if (v.attachments && Array.isArray(v.attachments)) {
                            for (const att of v.attachments) {
                                if (att.file && att.file.data) {
                                    try {
                                        const buffer = Buffer.from(att.file.data, 'base64');
                                        const ext = att.filePath ? path.extname(att.filePath) : '.bin';
                                        const fileName = `restored-att-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
                                        const uploadDir = path.join(process.cwd(), "public", "uploads");
                                        await fs.mkdir(uploadDir, { recursive: true });
                                        await fs.writeFile(path.join(uploadDir, fileName), buffer);
                                        restoredAttachments.push({
                                            filePath: `/uploads/${fileName}`,
                                            fileType: att.fileType
                                        });
                                    } catch (e) { console.error("Failed to restore attachment", e); }
                                }
                            }
                        }

                        return {
                            content: v.content,
                            longContent: v.longContent,
                            usageExample: v.usageExample,
                            variableDefinitions: v.variableDefinitions,
                            versionNumber: v.versionNumber,
                            createdById: userId,
                            resultText: v.resultText,
                            resultImage: resultImagePath,
                            changelog: v.changelog,
                            attachments: { create: restoredAttachments }
                        };
                    }))
                }
            },
            include: { versions: true }
        });

        if (p.currentVersionId) {
            const originalCurrentVersion = p.versions.find((v: any) => v.id === p.currentVersionId);
            if (originalCurrentVersion) {
                const newCurrentVersion = newPrompt.versions.find(v => v.versionNumber === originalCurrentVersion.versionNumber);
                if (newCurrentVersion) {
                    await prisma.prompt.update({
                        where: { id: newPrompt.id },
                        data: { currentVersionId: newCurrentVersion.id }
                    });
                }
            }
        }
    }
}
