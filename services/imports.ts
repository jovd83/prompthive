import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { detectFormat } from "@/lib/import-utils";
import { generateTechnicalId } from "./id-service";
import { generateColorFromName } from "@/lib/color-utils";
import { ImportSchema, ImportItemSchema } from "@/lib/validations";
import { z } from "zod";

type ValidatedImportData = z.infer<typeof ImportItemSchema>;

// Helper to handle image restoration (could be moved to a storage service later)
async function restoreImage(fileData: string, originalPath: string | undefined): Promise<string | null> {
    try {
        const buffer = Buffer.from(fileData, 'base64');
        const ext = originalPath ? path.extname(originalPath) : '.png';
        const fileName = `restored-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, fileName), buffer);
        return `/uploads/${fileName}`;
    } catch (e) {
        console.error("Failed to restore image", e);
        return null;
    }
}

// Helper to batch process tags
async function ensureTags(tagNames: Set<string>): Promise<Map<string, string>> {
    if (tagNames.size === 0) return new Map();

    const names = Array.from(tagNames);
    const existingTags = await prisma.tag.findMany({
        where: { name: { in: names } }
    });

    const existingMap = new Map(existingTags.map(t => [t.name, t.id]));
    const missingNames = names.filter(n => !existingMap.has(n));

    // Create missing tags
    for (const name of missingNames) {
        // Prisma createMany doesn't return IDs in SQLite/some adapters, so we loop create (safer but slower)
        // OR we createMany then refetch. For safety with colors, we loop.
        // Optimization: This loop is only for NEW tags.
        const color = generateColorFromName(name);
        try {
            const newTag = await prisma.tag.create({
                data: { name, color }
            });
            existingMap.set(name, newTag.id);
        } catch (e) {
            // Race condition fallback
            const existing = await prisma.tag.findUnique({ where: { name } });
            if (existing) existingMap.set(name, existing.id);
        }
    }

    return existingMap;
}

// Helper to batch process collections (Roots only technically, but we handle flat list)
async function ensureCollections(collectionNames: Set<string>, userId: string): Promise<Map<string, string>> {
    if (collectionNames.size === 0) return new Map();

    const names = Array.from(collectionNames);
    const existingCols = await prisma.collection.findMany({
        where: {
            ownerId: userId,
            title: { in: names }
        }
    });

    const existingMap = new Map(existingCols.map(c => [c.title, c.id]));
    const missingNames = names.filter(n => !existingMap.has(n));

    for (const title of missingNames) {
        try {
            const newCol = await prisma.collection.create({
                data: { title, ownerId: userId }
            });
            existingMap.set(title, newCol.id);
        } catch (e) {
            const existing = await prisma.collection.findFirst({ where: { title, ownerId: userId } });
            if (existing) existingMap.set(title, existing.id);
        }
    }

    return existingMap;
}


export async function importStructureService(userId: string, definedCollections: any[]) {
    const idMap: Record<string, string> = {}; // oldId -> newId

    // 1. Identify Roots
    const childrenMap = new Map<string, any[]>();
    const roots: any[] = [];
    const allIds = new Set(definedCollections.map(c => c.id));

    for (const col of definedCollections) {
        if (!col.parentId || !allIds.has(col.parentId)) {
            roots.push(col);
        } else {
            if (!childrenMap.has(col.parentId)) childrenMap.set(col.parentId, []);
            childrenMap.get(col.parentId)?.push(col);
        }
    }

    // 2. Recursive Creation
    async function createRecursive(col: any, actualParentId: string | null) {
        const dbCol = await prisma.collection.upsert({
            where: {
                // Upsert requires unique constraint. 
                // We don't have a unique constraint on [title, parentId, ownerId] in primitive schema often, 
                // so we use findFirst/create logic or rely on ID if we had one.
                // Fallback to manual check to avoid unique constraint errors if schema lacks it.
                id: "non-existent-id" // Force create or simple logic below
            },
            update: {},
            create: {
                title: col.title,
                description: col.description,
                parentId: actualParentId,
                ownerId: userId
            }
        }).catch(async () => {
            // Fallback for logic if upsert fails or isn't viable
            let found = await prisma.collection.findFirst({
                where: { title: col.title, parentId: actualParentId, ownerId: userId }
            });
            if (!found) {
                found = await prisma.collection.create({
                    data: {
                        title: col.title,
                        description: col.description,
                        parentId: actualParentId,
                        ownerId: userId
                    }
                });
            }
            return found;
        });

        idMap[col.id] = dbCol.id;

        const children = childrenMap.get(col.id) || [];
        for (const child of children) {
            await createRecursive(child, dbCol.id);
        }
    }

    // Execute
    for (const root of roots) {
        await createRecursive(root, null);
    }

    return idMap;
}

export async function importPromptsService(userId: string, data: ValidatedImportData[], collectionIdMap?: Record<string, string>) {
    let count = 0;
    let skipped = 0;
    const pendingLinks: { sourcePromptId: string, targetTechnicalIds: string[] }[] = [];
    const technicalIdMap = new Map<string, string>();

    // 1. Gather all unique Tags and Collection Names to batch create
    const allTagNames = new Set<string>();
    const allCollectionNames = new Set<string>();

    data.forEach(item => {
        // Tags
        const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',').map(t => t.trim()) : []);
        tags.forEach(t => t && allTagNames.add(t));

        // Collections (Names)
        const cols = Array.isArray(item.collections) ? item.collections : (item.collections ? [item.collections] : []);
        if (item.collection) cols.push(String(item.collection));
        // PromptCat specific
        const cats = Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : (item.category ? [item.category] : []));

        [...cols, ...cats].forEach(c => {
            const clean = String(c).trim();
            if (clean) allCollectionNames.add(clean);
        });
    });

    // 2. Resolve Maps
    const tagMap = await ensureTags(allTagNames);
    const collectionNameMap = await ensureCollections(allCollectionNames, userId);

    // 3. Process Items
    for (const item of data) {
        if (!item.title || (!item.content && (!item.versions || item.versions.length === 0))) continue;

        // Skip if exists
        const existing = await prisma.prompt.findFirst({
            where: { createdById: userId, title: item.title },
            select: { id: true }
        });
        if (existing) {
            skipped++;
            continue;
        }

        // Tags
        const itemTags = Array.isArray(item.tags)
            ? item.tags
            : (item.tags ? String(item.tags).split(',').map(t => t.trim()).filter(Boolean) : []);
        const tagIds = itemTags.map(t => tagMap.get(t)).filter(Boolean) as string[];

        // Collections
        const collectionIds = new Set<string>();

        // ID Mapping (V2)
        if (item.collectionIds && Array.isArray(item.collectionIds) && collectionIdMap) {
            item.collectionIds.forEach(oldId => {
                if (collectionIdMap[oldId]) collectionIds.add(collectionIdMap[oldId]);
            });
        }

        // Name Mapping
        const itemCols = [
            ...(Array.isArray(item.collections) ? item.collections : []),
            ...(item.collection ? [item.collection] : []),
            ...(Array.isArray(item.categories) ? item.categories : []),
            ...(item.category ? [item.category] : [])
        ];

        itemCols.forEach(c => {
            const id = collectionNameMap.get(String(c).trim());
            if (id) collectionIds.add(id);
        });

        // Technical ID
        let technicalId = item.technicalId;
        if (!technicalId) {
            // Try to generate from first collection name
            const firstColName = itemCols.length > 0 ? String(itemCols[0]) : null;
            if (firstColName) {
                technicalId = await generateTechnicalId(firstColName);
            } else if (collectionIds.size > 0) {
                // Fallback fetch
                const firstColId = Array.from(collectionIds)[0];
                const col = await prisma.collection.findUnique({ where: { id: firstColId }, select: { title: true } });
                if (col) technicalId = await generateTechnicalId(col.title);
            }
        }

        // Prepare Versions
        let versionsToCreate: any[] = [];

        if (item.versions && item.versions.length > 0) {
            versionsToCreate = await Promise.all(item.versions.map(async (v, idx) => {
                let resultImagePath = null;
                // Handle complex result image object
                if (v.resultImage && typeof v.resultImage === 'object' && 'file' in v.resultImage && v.resultImage.file?.data) {
                    resultImagePath = await restoreImage(v.resultImage.file.data, v.resultImage.path);
                } else if (typeof v.resultImage === 'string') {
                    resultImagePath = v.resultImage;
                }

                return {
                    versionNumber: v.versionNumber || (item.versions!.length - idx),
                    content: v.content || "",
                    shortContent: v.shortContent || v.longContent,
                    usageExample: v.usageExample,
                    variableDefinitions: typeof v.variableDefinitions === 'string'
                        ? v.variableDefinitions
                        : JSON.stringify(v.variableDefinitions || []),
                    resultText: v.resultText,
                    resultImage: resultImagePath,
                    changelog: v.changelog,
                    createdById: userId,
                };
            }));
        } else {
            // V1 Flat format
            versionsToCreate = [{
                versionNumber: 1,
                content: item.content || "",
                shortContent: "", // Legacy mapping removed for brevity, handled in schema if needed
                description: item.description, // Often stored in prompt description, but maybe version note?
                variableDefinitions: "[]", // Simplified for now
                createdById: userId
            }];
        }

        // Create Prompt
        const prompt = await prisma.prompt.create({
            data: {
                title: item.title,
                description: item.description || "",
                createdById: userId,
                technicalId,
                tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
                collections: collectionIds.size > 0 ? { connect: Array.from(collectionIds).map(id => ({ id })) } : undefined,
                versions: { create: versionsToCreate }
            },
            include: { versions: true }
        });

        // Update Current Version (Safeguard)
        if (prompt.versions.length > 0) {
            const latest = prompt.versions.sort((a, b) => b.versionNumber - a.versionNumber)[0];
            await prisma.prompt.update({
                where: { id: prompt.id },
                data: { currentVersionId: latest.id }
            });
        }

        // Store Mapping for Links
        if (item.technicalId) technicalIdMap.set(item.technicalId, prompt.id);
        if (item.relatedPrompts && item.relatedPrompts.length > 0) {
            pendingLinks.push({
                sourcePromptId: prompt.id,
                targetTechnicalIds: item.relatedPrompts
            });
        }

        count++;
    }

    // 4. Link Resolution
    if (pendingLinks.length > 0) {
        for (const link of pendingLinks) {
            const targetIds = link.targetTechnicalIds.map(tid => technicalIdMap.get(tid)).filter(Boolean) as string[];
            if (targetIds.length > 0) {
                await prisma.prompt.update({
                    where: { id: link.sourcePromptId },
                    data: { relatedPrompts: { connect: targetIds.map(id => ({ id })) } }
                });
            }
        }
    }

    return { count, skipped };
}

export async function importUnifiedService(userId: string, data: any, collectionIdMap?: Record<string, string>) {
    // 1. Strict Validation
    const validation = ImportSchema.safeParse(data);
    if (!validation.success) {
        console.error("Import Validation Failed:", validation.error);
        throw new Error("Invalid import data format.");
    }

    const validatedData = validation.data;
    const format = detectFormat(validatedData);

    if (format === 'PROMPTCAT') {
        const promptCatData = validatedData as { prompts: ValidatedImportData[], folders?: any[] };
        // Map folders if present (PromptCat specific logic simplified here for batching)
        // For now, we reuse the robust importPromptsService but we might need to handle the specific folder structure mapping if it differs significantly. 
        // Assuming normalized structure via Schema.
        const prompts = Array.isArray(promptCatData) ? promptCatData : (promptCatData.prompts || []);
        return importPromptsService(userId, prompts, collectionIdMap);
    } else {
        const prompts = Array.isArray(validatedData) ? validatedData : ((validatedData as any).prompts || []);
        return importPromptsService(userId, prompts, collectionIdMap);
    }
}

// Re-export deprecated service for backward compatibility if strict necessary, or alias it.
export const importPromptCatService = importUnifiedService;
