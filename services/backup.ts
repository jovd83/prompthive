import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import { existsSync, readFileSync } from "fs";
import path from "path";

export interface SaveSettingsInput {
    autoBackupEnabled: boolean;
    backupPath?: string | null;
    backupFrequency: string;
}

// Helper for backup (server-side only)
async function getFileAsBase64(urlPath: string | null): Promise<{ data: string; type: string } | null> {
    if (!urlPath) return null;
    try {
        const relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        const fullPath = path.join(process.cwd(), "public", relativePath);
        try {
            await fs.access(fullPath);
        } catch {
            return null; // file does not exist
        }
        const fileBuffer = await fs.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase().substring(1);
        let mimeType = "application/octet-stream";
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) mimeType = `image/${ext}`;
        return {
            data: fileBuffer.toString('base64'),
            type: mimeType
        };
    } catch (e: unknown) {
        console.warn(`[BackupService] Warning: Could not read file at ${urlPath}`, e instanceof Error ? e.message : String(e));
    }
    return null;
}

export async function saveSettingsService(userId: string, data: SaveSettingsInput) {
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

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${timestamp}_TMT_autobackup.json`;
        const fullPath = path.join(backupPath, filename);

        await fs.mkdir(backupPath, { recursive: true });

        // Open a file handle for writing
        const fileHandle = await fs.open(fullPath, 'w');

        // Write header
        await fileHandle.write(JSON.stringify({
            timestamp: new Date().toISOString(),
            userId,
            collections,
            tags,
            settings
        }).slice(0, -1)); // Removes the closing '}'

        await fileHandle.write(',"prompts":[\n');

        for (let i = 0; i < prompts.length; i++) {
            const p = prompts[i];

            const richVersions = [];
            for (const v of p.versions) {
                const richAttachments = [];
                for (const a of v.attachments) {
                    richAttachments.push({
                        ...a,
                        file: await getFileAsBase64(a.filePath)
                    });
                }
                richVersions.push({
                    ...v,
                    resultImageFile: await getFileAsBase64(v.resultImage),
                    attachments: richAttachments
                });
            }

            const richPrompt = {
                ...p,
                versions: richVersions
            };

            const chunk = JSON.stringify(richPrompt) + (i < prompts.length - 1 ? ",\n" : "\n");
            await fileHandle.write(chunk);
        }

        await fileHandle.write(']}');
        await fileHandle.close();

        console.log(`[BackupService] Backup saved to ${fullPath}`);
        return true;
    } catch (error: unknown) {
        console.error("[BackupService] Backup failed:", error instanceof Error ? error.message : String(error));
        // Ensures caller is aware it failed by uniformly returning false
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
    } catch (e: unknown) {
        console.error("[BackupService] Directory read error:", e instanceof Error ? e.message : String(e));
        throw new Error("Could not access backup directory.");
    }

    const backupFiles = files
        .filter(f => f.endsWith('_TMT_autobackup.json'))
        .sort()
        .reverse();

    if (backupFiles.length === 0) throw new Error("No backup files found.");

    const latestFile = backupFiles[0];
    const fullPath = path.join(backupPath, latestFile);

    const content = await fs.readFile(fullPath, 'utf-8');
    const backupData = JSON.parse(content);

    if (backupData.userId !== userId) throw new Error("Backup does not belong to this user.");

    await dropAllDataService(userId);

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
        const tagIds: string[] = [];
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
                    create: await Promise.all(p.versions.map(async (v: Record<string, any>) => {
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
                            } catch (e: unknown) {
                                console.error("[BackupService] Failed to restore image", e instanceof Error ? e.message : String(e));
                            }
                        }

                        const restoredAttachments: { filePath: string; fileType: string }[] = [];
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
                                    } catch (e: unknown) {
                                        console.error("[BackupService] Failed to restore attachment", e instanceof Error ? e.message : String(e));
                                    }
                                }
                            }
                        }

                        return {
                            content: v.content,
                            longContent: v.longContent,
                            shortContent: v.shortContent,
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
            const originalCurrentVersion = p.versions.find((v: Record<string, any>) => v.id === p.currentVersionId);
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
