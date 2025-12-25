
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { detectFormat } from "@/lib/import-utils";

export async function importPromptsService(userId: string, data: any[]) {
    let count = 0;
    let skipped = 0;
    for (const item of data) {
        if (!item.title || !item.content && (!item.versions || item.versions.length === 0)) continue;

        const tagIds = [];
        if (item.tags) {
            const tagNames = Array.isArray(item.tags) ? item.tags : item.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
            for (const tagName of tagNames) {
                let tag = await prisma.tag.findUnique({ where: { name: tagName } });
                if (!tag) {
                    tag = await prisma.tag.create({ data: { name: tagName } });
                }
                tagIds.push(tag.id);
            }
        }

        const collectionIds: string[] = [];

        // Handle plural collections array (strings)
        if (item.collections && Array.isArray(item.collections)) {
            for (const col of item.collections) {
                const collectionName = String(col).trim();
                if (collectionName) {
                    let collection = await prisma.collection.findFirst({
                        where: { title: collectionName, ownerId: userId }
                    });
                    if (!collection) {
                        collection = await prisma.collection.create({
                            data: { title: collectionName, ownerId: userId }
                        });
                    }
                    collectionIds.push(collection.id);
                }
            }
        }

        // Handle singular collection (backward compatibility)
        if (item.collection) {
            const collectionName = String(item.collection).trim();
            if (collectionName) {
                let collection = await prisma.collection.findFirst({
                    where: { title: collectionName, ownerId: userId }
                });
                if (!collection) {
                    collection = await prisma.collection.create({
                        data: {
                            title: collectionName,
                            ownerId: userId
                        }
                    });
                }
                if (!collectionIds.includes(collection.id)) {
                    collectionIds.push(collection.id);
                }
            }
        }

        let versionsToCreate: any[] = [];

        if (item.versions && Array.isArray(item.versions) && item.versions.length > 0) {
            versionsToCreate = await Promise.all(item.versions.map(async (v: any) => {
                let resultImagePath = v.resultImage ? (v.resultImage.path || v.resultImage) : null;
                if (v.resultImage && typeof v.resultImage === 'object' && v.resultImage.file) {
                    resultImagePath = v.resultImage.path;
                    if (v.resultImage.file.data) {
                        try {
                            const buffer = Buffer.from(v.resultImage.file.data, 'base64');
                            const ext = resultImagePath ? path.extname(resultImagePath) : '.png';
                            const fileName = `restored-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
                            const uploadDir = path.join(process.cwd(), "public", "uploads");
                            await fs.mkdir(uploadDir, { recursive: true });
                            await fs.writeFile(path.join(uploadDir, fileName), buffer);
                            resultImagePath = `/uploads/${fileName}`;
                        } catch (e) { console.error("Failed to restore image", e); }
                    }
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
                    shortContent: v.shortContent || v.longContent, // Map legacy longContent to shortContent
                    usageExample: v.usageExample,
                    variableDefinitions: typeof v.variableDefinitions === 'string' ? v.variableDefinitions : JSON.stringify(v.variableDefinitions || []),
                    versionNumber: v.versionNumber,
                    createdById: userId,
                    resultText: v.resultText,
                    resultImage: resultImagePath,
                    changelog: v.changelog,
                    attachments: { create: restoredAttachments }
                };
            }));
        } else if (item.content) {
            versionsToCreate = [{
                content: item.content,
                shortContent: item.shortContent || item.longContent, // Map legacy longContent
                usageExample: item.usageExample,
                variableDefinitions: typeof item.variableDefinitions === 'string' ? item.variableDefinitions : "[]",
                resultText: item.resultText,
                versionNumber: 1,
                createdById: userId,
            }];
            versionsToCreate[0].variableDefinitions = (() => {
                if (!item.variableDefinitions) return "[]";
                if (Array.isArray(item.variableDefinitions)) {
                    if (item.variableDefinitions.length > 0 && typeof item.variableDefinitions[0] === 'string') {
                        return JSON.stringify(item.variableDefinitions.map((v: string) => ({ key: v, description: "" })));
                    }
                    return JSON.stringify(item.variableDefinitions);
                }
                if (typeof item.variableDefinitions === 'string') {
                    const trimmed = item.variableDefinitions.trim();
                    if (trimmed.startsWith('[')) return trimmed;
                    const vars = trimmed.split(',').map((v: string) => v.trim().replace(/^\{\{|\}\}$/g, '')).filter(Boolean);
                    return JSON.stringify(vars.map((v: string) => ({ key: v, description: "" })));
                }
                return "[]";
            })();
        }

        if (versionsToCreate.length === 0) continue;

        const existing = await prisma.prompt.findFirst({
            where: { createdById: userId, title: item.title }
        });
        if (existing) {
            skipped++;
            continue;
        }

        const prompt = await prisma.prompt.create({
            data: {
                title: item.title,
                description: item.description || "",
                createdById: userId,
                tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
                collections: collectionIds.length > 0 ? { connect: collectionIds.map(id => ({ id })) } : undefined,
                versions: {
                    create: versionsToCreate
                },
            },
            include: { versions: true },
        });

        const sortedVersions = prompt.versions.sort((a, b) => b.versionNumber - a.versionNumber);

        await prisma.prompt.update({
            where: { id: prompt.id },
            data: { currentVersionId: sortedVersions[0].id },
        });

        count++;
    }
    return { count, skipped };
}

export async function importPromptCatService(userId: string, data: any) {
    let count = 0;
    let skipped = 0;
    const prompts = Array.isArray(data) ? data : (data.prompts || []);
    const folders = !Array.isArray(data) && data.folders ? data.folders : [];
    const folderMap: Record<string, string> = {};

    for (const folder of folders) {
        if (!folder.name) continue;
        let collection = await prisma.collection.findFirst({
            where: { title: folder.name, ownerId: userId }
        });
        if (!collection) {
            collection = await prisma.collection.create({
                data: { title: folder.name, ownerId: userId }
            });
        }
        if (folder.id) folderMap[folder.id] = collection.id;
    }

    for (const item of prompts) {
        const title = item.title || "Untitled Prompt";
        const content = item.body || item.content || "";
        const description = item.notes || item.description || "";
        const tagIds = [];
        const rawTags = Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []);

        for (const tagName of rawTags) {
            const cleanName = String(tagName).trim();
            if (!cleanName) continue;
            let tag = await prisma.tag.findUnique({ where: { name: cleanName } });
            if (!tag) {
                tag = await prisma.tag.create({ data: { name: cleanName } });
            }
            tagIds.push(tag.id);
        }

        const collectionIds = [];
        const rawCategories = Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : (item.category ? [item.category] : []));

        for (const catName of rawCategories) {
            const cleanName = String(catName).trim();
            if (!cleanName) continue;
            let collection = await prisma.collection.findFirst({ where: { title: cleanName, ownerId: userId } });
            if (!collection) {
                collection = await prisma.collection.create({
                    data: { title: cleanName, ownerId: userId }
                });
            }
            collectionIds.push(collection.id);
        }

        if (item.folderId && folderMap[item.folderId]) {
            collectionIds.push(folderMap[item.folderId]);
        }

        if (!content) continue;

        const existing = await prisma.prompt.findFirst({
            where: { createdById: userId, title }
        });
        if (existing) {
            skipped++;
            continue;
        }

        const prompt = await prisma.prompt.create({
            data: {
                title,
                description,
                createdById: userId,
                tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
                collections: collectionIds.length > 0 ? { connect: collectionIds.map(id => ({ id })) } : undefined,
                versions: {
                    create: {
                        content,
                        versionNumber: 1,
                        createdById: userId,
                    },
                },
            },
            include: { versions: true },
        });

        await prisma.prompt.update({
            where: { id: prompt.id },
            data: { currentVersionId: prompt.versions[0].id },
        });

        count++;
    }
    return { count, skipped };
}



export async function importUnifiedService(userId: string, data: any) {
    const format = detectFormat(data);
    if (format === 'PROMPTCAT') {
        return importPromptCatService(userId, data);
    } else {
        const dataArray = Array.isArray(data) ? data : [data];
        return importPromptsService(userId, dataArray);
    }
}
