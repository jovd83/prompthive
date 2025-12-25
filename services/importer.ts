
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

// Helper to copy file to uploads folder
async function copyToUploads(sourcePath: string): Promise<{ relativePath: string, mimeType: string }> {
    const ext = path.extname(sourcePath).toLowerCase();
    const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(UPLOAD_DIR)) {
        await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Keep original filename as requested by user. Collisions might overwrite existing files.
    const uniqueName = path.basename(sourcePath);
    const targetPath = path.join(UPLOAD_DIR, uniqueName);

    // If we want to be safe we could check if exists and append counter, but user said "keep the filenames the same".
    // We will follow instruction strictly: same filename. This implies overwrite or reuse if exists.
    // copyFile replaces by default.

    await fs.promises.copyFile(sourcePath, targetPath);

    // Simple mime detection
    let mimeType = 'application/octet-stream';
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) mimeType = `image/${ext.substring(1).replace('jpg', 'jpeg')}`;
    if (ext === '.pdf') mimeType = 'application/pdf';
    if (ext === '.txt') mimeType = 'text/plain';
    if (ext === '.json') mimeType = 'application/json';
    if (ext === '.md') mimeType = 'text/markdown';

    return { relativePath: `/uploads/${uniqueName}`, mimeType };
}

// Recursive processor
async function processDirectory(dirPath: string, parentCollectionId: string | null, userId: string): Promise<number> {
    const dirName = path.basename(dirPath);
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    // Check if this folder is a Prompt (Leaf) or Collection (Branch)
    const textFiles = entries.filter(e => e.isFile() && ['.txt', '.md', '.markdown'].includes(path.extname(e.name).toLowerCase()));

    let importedCount = 0;

    if (textFiles.length > 0) {
        // --- IT IS A PROMPT ---
        // This folder itself represents a prompt.

        // 1. Prepare Content
        const mainFile = textFiles[0];
        let content = await fs.promises.readFile(path.join(dirPath, mainFile.name), 'utf-8');

        if (textFiles.length > 1) {
            for (let i = 1; i < textFiles.length; i++) {
                const extraContent = await fs.promises.readFile(path.join(dirPath, textFiles[i].name), 'utf-8');
                content += `\n\n--- ${textFiles[i].name} ---\n${extraContent}`;
            }
        }

        const description = content.substring(0, 150).replace(/\n/g, ' ') + '...';

        // 2. Create Prompt
        const prompt = await prisma.prompt.create({
            data: {
                title: dirName, // Folder Name = Prompt Title
                description: description,
                createdById: userId,
                collections: parentCollectionId ? { connect: { id: parentCollectionId } } : undefined,
            }
        });

        // 3. Create Version
        const version = await prisma.promptVersion.create({
            data: {
                promptId: prompt.id,
                versionNumber: 1,
                content: content,
                changelog: 'Imported from local folder',
                createdById: userId
            }
        });

        await prisma.prompt.update({
            where: { id: prompt.id },
            data: { currentVersionId: version.id }
        });

        // 4. Attach Non-Text Files
        const attachmentFiles = entries.filter(e => e.isFile() && !['.txt', '.md', '.markdown'].includes(path.extname(e.name).toLowerCase()) && !e.name.startsWith('.'));

        for (const file of attachmentFiles) {
            const fullPath = path.join(dirPath, file.name);
            const { relativePath, mimeType } = await copyToUploads(fullPath);

            await prisma.attachment.create({
                data: {
                    versionId: version.id,
                    filePath: relativePath,
                    fileType: mimeType,
                    originalName: file.name
                } as any // Cast to any to handle potential schema mismatch dev-time, assuming runtime schema is correct.
            });
        }
        importedCount++;

    } else {
        // --- IT IS A COLLECTION ---
        // This folder is a container. 

        // 1. Create Collection (ensure it exists)
        let collection = await prisma.collection.findFirst({
            where: { title: dirName, parentId: parentCollectionId, ownerId: userId }
        });

        if (!collection) {
            collection = await prisma.collection.create({
                data: {
                    title: dirName,
                    ownerId: userId,
                    parentId: parentCollectionId
                }
            });
        }

        // 2. Recurse for all subdirectories
        const subDirs = entries.filter(e => e.isDirectory());
        for (const sub of subDirs) {
            importedCount += await processDirectory(path.join(dirPath, sub.name), collection.id, userId);
        }
    }

    return importedCount;
}

export async function importLocalFolder(rootPath: string, userId: string, targetCollectionId?: string) {
    if (!fs.existsSync(rootPath)) {
        throw new Error(`Path does not exist: ${rootPath}`);
    }

    // Treat the `rootPath` as the Root Collection.
    const rootDirName = path.basename(rootPath);

    // Determine parent ID (null if not provided)
    const parentId = targetCollectionId || null;

    let rootCollection = await prisma.collection.findFirst({
        where: { title: rootDirName, parentId: parentId, ownerId: userId }
    });

    if (!rootCollection) {
        rootCollection = await prisma.collection.create({
            data: {
                title: rootDirName,
                ownerId: userId,
                parentId: parentId
            }
        });
    }

    // Process all children of Root
    const entries = await fs.promises.readdir(rootPath, { withFileTypes: true });
    let count = 0;

    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += await processDirectory(path.join(rootPath, entry.name), rootCollection.id, userId);
        }
    }

    return count;
}
