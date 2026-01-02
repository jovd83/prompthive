"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper for file encoding
function getFileAsBase64(urlPath: string | null): { data: string; type: string } | null {
    if (!urlPath) return null;
    try {
        const relativePath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
        const fullPath = path.join(process.cwd(), "public", relativePath);

        if (fs.existsSync(fullPath)) {
            const fileBuffer = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath).toLowerCase().substring(1);
            let mimeType = "application/octet-stream";
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) mimeType = `image/${ext}`;
            if (ext === 'pdf') mimeType = 'application/pdf';
            if (ext === 'txt') mimeType = 'text/plain';

            return {
                data: fileBuffer.toString('base64'),
                type: mimeType
            };
        }
    } catch (e) {
        console.error(`Failed to read file for backup: ${urlPath}`, e);
    }
    return null;
}

export async function getExportMeta(collectionIds?: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    // 1. Determine Prompt IDs
    const where: any = { createdById: userId };
    if (collectionIds && collectionIds.length > 0) {
        where.collections = { some: { id: { in: collectionIds } } };
    }

    const prompts = await prisma.prompt.findMany({
        where,
        select: { id: true, collections: { select: { id: true } } }
    });

    const promptIds = prompts.map(p => p.id);

    // 2. Build Collection Hierarchy (definedCollections)
    // We need all collections referenced by these prompts, PLUS their ancestors.
    let relevantCollectionIds = new Set<string>();

    // Add collections directly linked to exported prompts
    prompts.forEach(p => {
        p.collections.forEach(c => relevantCollectionIds.add(c.id));
    });

    // If "Select All" or no filter, we might want ALL collections?
    // If strict filter, we only want related ones.
    // Let's resolve ancestors for the relevant ones.
    let collectionsToExport = [];

    // Iteratively fetch parents
    let currentPool = Array.from(relevantCollectionIds);
    let allFoundIds = new Set(currentPool);

    // Fetch all user collections to map parents efficiently (assuming user doesn't have 10k collections)
    const allUserCollections = await prisma.collection.findMany({
        where: { ownerId: userId },
        select: { id: true, title: true, description: true, parentId: true }
    });

    const collectionMap = new Map(allUserCollections.map(c => [c.id, c]));

    // resolve ancestors
    const queue = [...currentPool];
    while (queue.length > 0) {
        const id = queue.pop();
        if (!id) continue;
        const col = collectionMap.get(id);
        if (col && col.parentId && !allFoundIds.has(col.parentId)) {
            allFoundIds.add(col.parentId);
            queue.push(col.parentId); // Recurse up
        }
    }

    // Now build the array
    const definedCollections = Array.from(allFoundIds)
        .map(id => collectionMap.get(id))
        .filter(Boolean) // Remove nulls if any
        .map(c => ({
            id: c!.id,
            title: c!.title,
            description: c!.description,
            parentId: c!.parentId
        }));

    return {
        success: true,
        totalPrompts: promptIds.length,
        promptIds: promptIds,
        definedCollections
    };
}

export async function getExportBatch(ids: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const prompts = await prisma.prompt.findMany({
        where: { id: { in: ids }, createdById: session.user.id },
        include: {
            tags: true,
            versions: {
                include: { attachments: true },
                orderBy: { versionNumber: "desc" }
            },
            collections: true,
        },
    });

    // Transform to Export Format
    const exportData = prompts.map((prompt) => {
        return {
            id: prompt.id,
            title: prompt.title,
            description: prompt.description,
            tags: prompt.tags.map(t => t.name),
            collections: prompt.collections.map(c => c.title), // Legacy support
            collectionIds: prompt.collections.map(c => c.id),  // New V2 linking
            viewCount: prompt.viewCount,
            copyCount: prompt.copyCount,
            createdAt: prompt.createdAt,
            updatedAt: prompt.updatedAt,
            versions: prompt.versions.map(v => ({
                versionNumber: v.versionNumber,
                content: v.content,
                shortContent: v.shortContent,
                usageExample: v.usageExample,
                variableDefinitions: v.variableDefinitions,
                model: v.model,
                changelog: v.changelog,
                resultText: v.resultText,
                resultImage: v.resultImage ? {
                    path: v.resultImage,
                    file: getFileAsBase64(v.resultImage)
                } : null,
                attachments: v.attachments.map(a => ({
                    filePath: a.filePath,
                    fileType: a.fileType,
                    file: getFileAsBase64(a.filePath)
                })),
                createdAt: v.createdAt
            }))
        };
    });

    return { success: true, prompts: exportData };
}
