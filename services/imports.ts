import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import { detectFormat } from "@/lib/import-utils";
import { generateTechnicalId } from "./id-service";
import { ImportSchema, ImportItemSchema } from "@/lib/validations";
import { z } from "zod";

type ValidatedImportData = z.infer<typeof ImportItemSchema>;

import { restoreImage, ensureTags, ensureCollections } from "./import-helpers";

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
    async function createRecursive(col: any, actualParentId: string | null, tx: any) {
        let found = await tx.collection.findFirst({
            where: { title: col.title, parentId: actualParentId, ownerId: userId }
        });

        if (!found) {
            found = await tx.collection.create({
                data: {
                    title: col.title,
                    description: col.description,
                    parentId: actualParentId,
                    ownerId: userId
                }
            });
        }

        idMap[col.id] = found.id;

        const children = childrenMap.get(col.id) || [];
        for (const child of children) {
            await createRecursive(child, found.id, tx);
        }
    }

    // Execute in serialized transaction
    await prisma.$transaction(async (tx) => {
        for (const root of roots) {
            await createRecursive(root, null, tx);
        }
    }, { timeout: 30000 });

    return idMap;
}

export async function importPromptsService(userId: string, data: ValidatedImportData[], collectionIdMap?: Record<string, string>) {
    let count = 0;
    let skipped = 0;
    const pendingLinks: { sourcePromptId: string, targetTechnicalIds: string[] }[] = [];
    const technicalIdMap = new Map<string, string>();
    const originalIdToNewId = new Map<string, string>();
    const pendingAgentSkillUpdates: { versionId: string, originalSkillIds: string[] }[] = [];

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

    // 3. Process Items In Chunks
    const CHUNK_SIZE = 50;
    const promptOperations = [];

    for (const item of data) {
        if (!item.title || (!item.content && (!item.versions || item.versions.length === 0))) continue;

        promptOperations.push(async (tx: any) => {
            // Skip if exists
            const existing = await tx.prompt.findFirst({
                where: { createdById: userId, title: item.title },
                select: { id: true }
            });
            if (existing) {
                if (item.id) {
                    originalIdToNewId.set(item.id, existing.id);
                    fs.appendFileSync('import-debug.log', `Mapped (Sk): ${item.id} -> ${existing.id} ("${item.title}")\n`);
                }
                if (item.technicalId) technicalIdMap.set(item.technicalId, existing.id);
                
                // metadata repair
                await tx.prompt.update({
                    where: { id: existing.id },
                    data: {
                        itemType: item.itemType === 'AGENT_SKILL' ? 'AGENT_SKILL' : undefined,
                        repoUrl: item.repoUrl || undefined,
                        installCommand: item.installCommand || undefined,
                    }
                });
                
                // Track existing versions for link remapping
                const existingVersions = await tx.promptVersion.findMany({
                    where: { promptId: existing.id },
                    select: { id: true, versionNumber: true }
                });
                
                // Re-use version remapping logic
                existingVersions.forEach((v: any) => {
                    let originalSkillIdsStr = "";
                    if (item.versions && Array.isArray(item.versions)) {
                        const ov = item.versions.find((ov: any) => {
                            const num = ov.versionNumber || (item.versions!.length - item.versions.indexOf(ov));
                            return num === v.versionNumber;
                        });
                        if (ov) originalSkillIdsStr = ov.agentSkillIds;
                    } else {
                        originalSkillIdsStr = item.agentSkillIds;
                    }

                    if (originalSkillIdsStr) {
                        try {
                            const skillIds = typeof originalSkillIdsStr === 'string' 
                                ? JSON.parse(originalSkillIdsStr) 
                                : originalSkillIdsStr;
                                
                            if (Array.isArray(skillIds) && skillIds.length > 0) {
                                pendingAgentSkillUpdates.push({ versionId: v.id, originalSkillIds: skillIds });
                            }
                        } catch (e) {}
                    }
                });

                // Store ID mapping even if skipped (so others can link to it)
                if (item.id) {
                    const normId = item.id.trim().replace(/^["']|["']$/g, '');
                    originalIdToNewId.set(normId, existing.id);
                    fs.appendFileSync('import-debug.log', `Mapped (Existing): ${normId} -> ${existing.id} ("${item.title}")\n`);
                }

                skipped++;
                return;
            }

            // Tags
            const itemTags = Array.isArray(item.tags)
                ? item.tags
                : (item.tags ? String(item.tags).split(',').map(t => t.trim()).filter(Boolean) : []);
            // Lookup using lowercase
            const tagIds = itemTags.map(t => tagMap.get(t.toLowerCase())).filter(Boolean) as string[];

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
                const firstColName = itemCols.length > 0 ? String(itemCols[0]) : null;
                if (firstColName) {
                    technicalId = await generateTechnicalId(firstColName, tx);
                } else if (collectionIds.size > 0) {
                    const firstColId = Array.from(collectionIds)[0];
                    const col = await tx.collection.findUnique({ where: { id: firstColId }, select: { title: true } });
                    if (col) technicalId = await generateTechnicalId(col.title, tx);
                } else {
                    technicalId = await generateTechnicalId("GEN", tx);
                }
            }

            // Prepare Versions
            let versionsToCreate: any[] = [];

            if (item.versions && item.versions.length > 0) {
                versionsToCreate = await Promise.all(item.versions.map(async (v: any, idx: number) => {
                    let resultImagePath = null;
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
                        agentUsage: v.agentUsage,
                        agentSkillIds: Array.isArray(v.agentSkillIds) ? JSON.stringify(v.agentSkillIds) : v.agentSkillIds,
                        changelog: v.changelog,
                        createdById: userId,
                        attachments: (v.attachments && Array.isArray(v.attachments)) ? {
                            create: (await Promise.all(v.attachments.map(async (a: any) => {
                                if (a.file?.data) {
                                    const restoredPath = await restoreImage(a.file.data, a.filePath);
                                    if (restoredPath) {
                                        return {
                                            filePath: restoredPath,
                                            fileType: a.fileType || 'application/octet-stream',
                                            originalName: a.filePath ? path.basename(a.filePath) : 'attachment'
                                        };
                                    }
                                }
                                return null;
                            }))).filter(Boolean) as any[]
                        } : undefined
                    };
                }));
            } else {
                versionsToCreate = [{
                    versionNumber: 1,
                    content: item.content || "",
                    shortContent: "",
                    description: item.description,
                    usageExample: item.usageExample,
                    variableDefinitions: typeof item.variableDefinitions === 'string'
                        ? item.variableDefinitions
                        : JSON.stringify(item.variableDefinitions || []),
                    resultText: item.resultText,
                    agentUsage: item.agentUsage,
                    agentSkillIds: Array.isArray(item.agentSkillIds) ? JSON.stringify(item.agentSkillIds) : item.agentSkillIds,
                    createdById: userId
                }];
            }

            // Create Prompt
            const prompt = await tx.prompt.create({
                data: {
                    title: item.title,
                    description: item.description || "",
                    createdById: userId,
                    technicalId,
                    itemType: item.itemType === 'AGENT_SKILL' ? 'AGENT_SKILL' : 'PROMPT',
                    repoUrl: item.repoUrl || null,
                    url: item.url || item.repoUrl || null,
                    installCommand: item.installCommand || null,
                    tags: tagIds.length > 0 ? { connect: tagIds.map(id => ({ id })) } : undefined,
                    collections: collectionIds.size > 0 ? { connect: Array.from(collectionIds).map(id => ({ id })) } : undefined,
                    versions: { create: versionsToCreate }
                },
                include: { versions: true }
            });

            // Store ID mapping
            if (item.id) {
                const normId = item.id.trim().replace(/^["']|["']$/g, '');
                originalIdToNewId.set(normId, prompt.id);
                fs.appendFileSync('import-debug.log', `Mapped: ${normId} -> ${prompt.id} ("${item.title}")\n`);
            }

            // Track versions for agentSkillIds remapping
            prompt.versions.forEach((v: any) => {
                let originalSkillIdsStr = "";
                if (item.versions && Array.isArray(item.versions)) {
                    // Match by version number to handle potential order changes in Prisma result
                    const ov = item.versions.find((ov: any) => {
                        const num = ov.versionNumber || (item.versions!.length - item.versions.indexOf(ov));
                        return num === v.versionNumber;
                    });
                    if (ov) originalSkillIdsStr = ov.agentSkillIds;
                } else {
                    originalSkillIdsStr = item.agentSkillIds;
                }

                if (originalSkillIdsStr) {
                    try {
                        const skillIds = typeof originalSkillIdsStr === 'string' 
                            ? JSON.parse(originalSkillIdsStr) 
                            : originalSkillIdsStr;
                            
                        if (Array.isArray(skillIds) && skillIds.length > 0) {
                            pendingAgentSkillUpdates.push({ versionId: v.id, originalSkillIds: skillIds });
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            });

            // Update Current Version (Safeguard)
            if (prompt.versions.length > 0) {
                const latest = prompt.versions.sort((a: any, b: any) => b.versionNumber - a.versionNumber)[0];
                await tx.prompt.update({
                    where: { id: prompt.id },
                    data: { currentVersionId: latest.id }
                });
            }

            // Store Mapping for Links
            if (item.technicalId) technicalIdMap.set(item.technicalId, prompt.id);
            
            fs.appendFileSync('import-debug.log', `Imported: "${item.title}" -> ${prompt.id} (Existing: ${!!existing})\n`);
            
            if (item.relatedPrompts && item.relatedPrompts.length > 0) {
                pendingLinks.push({
                    sourcePromptId: prompt.id,
                    targetTechnicalIds: item.relatedPrompts
                });
            }

            count++;
        });
    }

    // Execute in transaction chunks
    for (let i = 0; i < promptOperations.length; i += CHUNK_SIZE) {
        const chunk = promptOperations.slice(i, i + CHUNK_SIZE);
        await prisma.$transaction(async (tx) => {
            for (const op of chunk) {
                await op(tx);
            }
        }, { timeout: 120000 });
    }

    // 4. Link Resolution (Related Prompts)
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

    // 5. Return pending skill updates for deferred resolution (cross-batch safe)
    // Do NOT resolve inline — the skills may have been imported in a different batch
    return { count, skipped, pendingSkillUpdates: pendingAgentSkillUpdates };
}

/**
 * Resolve agent skill links AFTER all import batches have completed.
 * This runs as a single pass with access to the full title map and full DB state.
 */
export async function resolveAgentSkillLinksService(
    pendingUpdates: { versionId: string, originalSkillIds: string[] }[],
    idToTitleMap: Record<string, string>
) {
    let resolved = 0;
    let failed = 0;

    fs.appendFileSync('import-debug.log',
        `\n[${new Date().toISOString()}] === POST-IMPORT SKILL RESOLUTION ===\n` +
        `Pending versions: ${pendingUpdates.length}. Title map entries: ${Object.keys(idToTitleMap).length}\n`);

    for (const update of pendingUpdates) {
        const resolvedSkillIds: string[] = [];
        const debugLog: string[] = [];

        for (let oldId of update.originalSkillIds) {
            if (typeof oldId !== 'string') continue;
            oldId = oldId.trim().replace(/^["']|["']$/g, '');

            // Strategy 1: Title-based DB lookup (primary strategy — uses full file's title map)
            const title = idToTitleMap[oldId];
            if (title) {
                const byTitle = await prisma.prompt.findFirst({
                    where: { title },
                    select: { id: true }
                });
                if (byTitle) {
                    resolvedSkillIds.push(byTitle.id);
                    debugLog.push(`Resolved (Title): ${oldId} ("${title}") -> ${byTitle.id}`);
                    continue;
                } else {
                    debugLog.push(`Title Not In DB: "${title}"`);
                }
            }

            // Strategy 2: Direct DB lookup (ID survived as-is)
            const existsById = await prisma.prompt.findUnique({ where: { id: oldId }, select: { id: true } });
            if (existsById) {
                resolvedSkillIds.push(oldId);
                debugLog.push(`Resolved (Exists): ${oldId}`);
                continue;
            }

            failed++;
            debugLog.push(`Failed: ${oldId} (title=${title || 'NOT IN MAP'})`);
        }

        await prisma.promptVersion.update({
            where: { id: update.versionId },
            data: { agentSkillIds: JSON.stringify(resolvedSkillIds) }
        });

        resolved += resolvedSkillIds.length;

        try {
            const logLine = `[${new Date().toISOString()}] Version: ${update.versionId} | Skills: ${resolvedSkillIds.length}/${update.originalSkillIds.length}\n${debugLog.join('\n')}\n---\n`;
            fs.appendFileSync('import-debug.log', logLine);
        } catch (e) {}
    }

    fs.appendFileSync('import-debug.log',
        `[${new Date().toISOString()}] === RESOLUTION COMPLETE: ${resolved} resolved, ${failed} failed ===\n\n`);

    return { resolved, failed };
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
        const prompts = Array.isArray(promptCatData) ? promptCatData : (promptCatData.prompts || []);
        return importPromptsService(userId, prompts, collectionIdMap);
    } else {
        const prompts = Array.isArray(validatedData) ? validatedData : ((validatedData as any).prompts || []);
        const definedCollections = (validatedData as any).definedCollections;

        let idMap = collectionIdMap;
        if (definedCollections && !idMap) {
            idMap = await importStructureService(userId, definedCollections);
        }

        return importPromptsService(userId, prompts, idMap);
    }
}

// Re-export deprecated service for backward compatibility if strict necessary, or alias it.
export const importPromptCatService = importUnifiedService;
