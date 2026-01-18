
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { validateFileExtension } from "./utils";
import { uploadFile, deleteFile } from "./files";
import { generateTechnicalId } from "./id-service";
import { Prisma } from "@prisma/client";

import { generateColorFromName } from "@/lib/color-utils";

export async function createTagService(name: string) {
    // Determine color deterministically based on name for consistency
    const color = generateColorFromName(name);
    return prisma.tag.create({
        data: {
            name,
            color
        } as any,
    });
}

export type CreatePromptInput = {
    title: string;
    description: string;
    content: string;
    shortContent: string;
    usageExample: string;
    variableDefinitions: string;
    collectionId: string;
    tagIds: string[];
    resultText: string;
    resource?: string;
    isPrivate?: boolean;
};

export type CreateVersionInput = {
    promptId: string;
    title: string;
    content: string;
    shortContent: string;
    usageExample: string;
    variableDefinitions: string;
    resultText: string;
    resource?: string;
    collectionId: string;
    tagIds?: string[];
    changelog: string;
    description?: string;
    keepAttachmentIds: string[];
    keepResultImageIds: string[];
    existingResultImagePath?: string;
    isPrivate?: boolean;
};

export async function createPromptService(
    userId: string,
    input: CreatePromptInput,
    attachments: File[],
    resultImages: File[]
) {
    console.log("[Service] createPromptService called. prisma.prompt:", !!prisma?.prompt);
    const savedAttachments = [];

    if (attachments.length > 0) {
        for (const file of attachments) {
            if (file.size > 0) {
                const uploaded = await uploadFile(file);
                savedAttachments.push(uploaded);
            }
        }
    }

    let primaryResultImagePath: string | null = null;
    if (resultImages.length > 0) {
        for (const file of resultImages) {
            if (file.size > 0) {
                const uploaded = await uploadFile(file, "result-");
                savedAttachments.push({
                    ...uploaded,
                    role: "RESULT",
                });

                if (!primaryResultImagePath) primaryResultImagePath = uploaded.filePath;
            }
        }
    }

    const existing = await prisma.prompt.findFirst({
        where: { createdById: userId, title: input.title }
    });

    if (existing) {
        throw new Error("A prompt with this title already exists.");
    }

    // Determine Collection Name for ID generation
    let collectionName = "Unassigned";
    if (input.collectionId) {
        const collection = await prisma.collection.findUnique({
            where: { id: input.collectionId },
            select: { title: true }
        });
        if (collection) collectionName = collection.title;
    }

    const technicalId = await generateTechnicalId(collectionName);

    const prompt = await prisma.prompt.create({
        data: {
            title: input.title,
            technicalId: technicalId,
            isPrivate: input.isPrivate ?? false,
            // ... (skipping unchanged middle parts, wait I can't skip with replace_file_content unless I use chunks)
            // I should use multi_replace for targeted fixes.
            description: input.description,
            resource: input.resource,
            createdById: userId,
            collections: input.collectionId ? { connect: { id: input.collectionId } } : undefined,
            tags: input.tagIds.length > 0 ? { connect: input.tagIds.map(id => ({ id })) } : undefined,
            versions: {
                create: {
                    content: input.content,
                    shortContent: input.shortContent,
                    usageExample: input.usageExample,
                    variableDefinitions: input.variableDefinitions,
                    versionNumber: 1,
                    createdById: userId,
                    resultText: input.resultText,
                    resultImage: primaryResultImagePath,
                    attachments: {
                        create: savedAttachments,
                    },
                },
            },
        } as any,
        include: { versions: true },
    });

    await prisma.prompt.update({
        where: { id: prompt.id },
        data: { currentVersionId: prompt.versions[0].id },
    });

    return prompt;
}



export async function createVersionService(
    userId: string,
    input: CreateVersionInput,
    attachments: File[],
    resultImages: File[]
) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: input.promptId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!prompt) throw new Error("Prompt not found");

    // Lock check
    // Lock check
    if (prompt.isLocked) {
        throw new Error("Prompt is locked. Unlock it to make changes.");
    }

    const nextVersionNumber = (prompt.versions[0]?.versionNumber || 0) + 1;
    const savedAttachments: { filePath: string; fileType: string; originalName?: string; role?: string }[] = [];

    // Process kept attachments
    if (input.keepAttachmentIds.length > 0) {
        const existingAttachments = await prisma.attachment.findMany({
            where: {
                id: { in: input.keepAttachmentIds },
                version: { promptId: input.promptId },
            },
        });

        for (const att of existingAttachments) {
            savedAttachments.push({
                filePath: att.filePath,
                fileType: att.fileType,
                originalName: att.originalName || undefined, // Carry over existing originalName if present
            });
        }
    }

    // Process new attachments
    if (attachments.length > 0) {
        for (const file of attachments) {
            if (file.size > 0) {
                const uploaded = await uploadFile(file);
                savedAttachments.push(uploaded);
            }
        }
    }

    // Process kept result images
    if (input.keepResultImageIds.length > 0) {
        const existingResults = await prisma.attachment.findMany({
            where: {
                id: { in: input.keepResultImageIds },
                version: { promptId: input.promptId },
                role: "RESULT",
            },
        });

        for (const att of existingResults) {
            savedAttachments.push({
                filePath: att.filePath,
                fileType: att.fileType,
                originalName: att.originalName || undefined,
                role: "RESULT",
            });
        }
    }

    let primaryResultImagePath = null;
    if (input.existingResultImagePath) {
        const ext = path.extname(input.existingResultImagePath).toLowerCase().replace('.', '');
        const fileType = ext ? `image/${ext}` : "image/legacy";

        savedAttachments.push({
            filePath: input.existingResultImagePath,
            fileType: fileType,
            role: "RESULT",
        });
        primaryResultImagePath = input.existingResultImagePath;
    }

    // Process new result images
    if (resultImages.length > 0) {
        for (const file of resultImages) {
            if (file.size > 0) {
                const uploaded = await uploadFile(file, "result-");
                savedAttachments.push({
                    ...uploaded,
                    role: "RESULT",
                });

                if (!primaryResultImagePath) primaryResultImagePath = uploaded.filePath;
            }
        }
    }

    if (!primaryResultImagePath && input.keepResultImageIds.length > 0) {
        const firstKept = savedAttachments.find(att => att.role === "RESULT");
        if (firstKept) primaryResultImagePath = firstKept.filePath;
    }

    const newVersion = await prisma.promptVersion.create({
        data: {
            promptId: input.promptId,
            content: input.content,
            shortContent: input.shortContent,
            usageExample: input.usageExample,
            variableDefinitions: input.variableDefinitions,
            resultText: input.resultText,
            resultImage: primaryResultImagePath,
            versionNumber: nextVersionNumber,
            changelog: input.changelog,
            createdById: userId,
            attachments: {
                create: savedAttachments,
            },
        },
    });

    const updateData: Prisma.PromptUpdateInput = {
        currentVersionId: newVersion.id,
        title: input.title || undefined,
        description: input.description,
        resource: input.resource,
        isPrivate: input.isPrivate,
    };

    if (input.collectionId) {
        if (input.collectionId === "unassigned") {
            updateData.collections = { set: [] };
        } else {
            updateData.collections = { set: [{ id: input.collectionId }] };
        }
    }

    if (input.tagIds) {
        updateData.tags = { set: input.tagIds.map(id => ({ id })) };
    }

    await prisma.prompt.update({
        where: { id: input.promptId },
        data: updateData,
    });

    return newVersion;
}


export async function restoreVersionService(userId: string, promptId: string, versionId: string) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: { versions: true } // Check basic existence
    });

    if (!prompt) throw new Error("Prompt not found");

    // Check permissions
    if (prompt.createdById !== userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'ADMIN') throw new Error("Access denied");
    }

    const sourceVersion = await prisma.promptVersion.findUnique({
        where: { id: versionId },
        include: { attachments: true }
    });

    if (!sourceVersion || sourceVersion.promptId !== promptId) {
        throw new Error("Version not found for this prompt");
    }

    const attachmentIds = sourceVersion.attachments
        .filter(a => a.role !== 'RESULT')
        .map(a => a.id);

    const resultImageIds = sourceVersion.attachments
        .filter(a => a.role === 'RESULT')
        .map(a => a.id);

    const input: CreateVersionInput = {
        promptId: prompt.id,
        title: prompt.title,
        content: sourceVersion.content,
        shortContent: sourceVersion.shortContent || "",
        usageExample: sourceVersion.usageExample || "",
        variableDefinitions: sourceVersion.variableDefinitions || "",
        changelog: `Restored from version ${sourceVersion.versionNumber}`,
        resultText: sourceVersion.resultText || "",
        collectionId: "", // Don't change collection
        tagIds: undefined, // Don't change tags
        keepAttachmentIds: attachmentIds,
        keepResultImageIds: resultImageIds,
        existingResultImagePath: sourceVersion.resultImage || "",
    };

    return createVersionService(userId, input, [], []);
}

export async function cleanupPromptAssetsService(promptId: string) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: { versions: { include: { attachments: true } } }
    });

    if (!prompt) return;

    for (const version of prompt.versions) {
        for (const att of version.attachments) {
            if (att.filePath) {
                await deleteFile(att.filePath);
            }
        }

        if (version.resultImage) {
            const isAttached = version.attachments.some(a => a.filePath === version.resultImage);
            if (!isAttached) {
                await deleteFile(version.resultImage);
            }
        }
    }
}

export async function deletePromptService(userId: string, promptId: string) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
    });

    if (!prompt) {
        throw new Error("Prompt not found");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User prohibited");

    if (prompt.createdById !== userId && user.role !== 'ADMIN') {
        throw new Error("Access denied");
    }

    await cleanupPromptAssetsService(promptId);

    const promptWithTags = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { tags: { select: { id: true } } }
    });

    // Manual cleanup of foreign keys to safely delete prompt
    // 1. Delete associated Favorites
    await prisma.favorite.deleteMany({
        where: { promptId }
    });
    // 2. Delete associated Workflow Steps
    await prisma.workflowStep.deleteMany({
        where: { promptId }
    });

    await prisma.prompt.delete({
        where: { id: promptId },
    });

    // Cleanup unused tags (Batch optimized)
    if (promptWithTags && promptWithTags.tags.length > 0) {
        const descendantTagIds = promptWithTags.tags.map(t => t.id);

        // Find which of these tags are still in use by ANY prompt
        const tagsInUse = await prisma.tag.findMany({
            where: {
                id: { in: descendantTagIds },
                prompts: { some: {} } // Has at least one prompt
            },
            select: { id: true }
        });

        const inUseSet = new Set(tagsInUse.map(t => t.id));
        const tagsToDelete = descendantTagIds.filter(id => !inUseSet.has(id));

        if (tagsToDelete.length > 0) {
            await prisma.tag.deleteMany({
                where: { id: { in: tagsToDelete } }
            });
        }
    }
}

export async function deleteUnusedTagsService() {
    const unusedTags = await prisma.tag.findMany({
        where: { prompts: { none: {} } },
        select: { id: true }
    });

    if (unusedTags.length > 0) {
        await prisma.tag.deleteMany({
            where: { id: { in: unusedTags.map(t => t.id) } }
        });
    }

    return { count: unusedTags.length };
}

export async function getAllPromptsSimple(userId: string) {
    const prompts = await prisma.prompt.findMany({
        where: { createdById: userId },
        select: {
            id: true,
            title: true,
            versions: {
                take: 1,
                orderBy: { versionNumber: 'desc' },
                select: {
                    variableDefinitions: true
                }
            }
        },
        orderBy: { title: 'asc' }
    });

    return prompts.map(p => ({
        id: p.id,
        title: p.title,
        variableDefinitions: p.versions[0]?.variableDefinitions
    }));
}

export async function movePromptService(userId: string, promptId: string, collectionId: string | null) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: { collections: true }
    });

    if (!prompt) throw new Error("Prompt not found");



    if (prompt.isLocked && prompt.createdById !== userId) {
        throw new Error("Prompt is locked by the creator.");
    }

    // Permission check removed as per CR-006 (Relax Permissions)


    const collectionIdToUse = collectionId;

    let newTechnicalId: string | undefined = undefined;

    if (collectionIdToUse) {
        // Fetch new collection title
        const collection = await prisma.collection.findUnique({
            where: { id: collectionIdToUse },
            select: { title: true }
        });
        if (collection) {
            newTechnicalId = await generateTechnicalId(collection.title);
        }
    } else {
        // Moving to root/unassigned
        newTechnicalId = await generateTechnicalId("Unassigned");
    }

    if (collectionId) {
        // Move to specific collection
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                technicalId: newTechnicalId,
                collections: {
                    set: [{ id: collectionId }]
                }
            } as any
        });
    } else {
        // Move to root (remove from all collections)
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                technicalId: newTechnicalId,
                collections: {
                    set: []
                }
            } as any
        });
    }
}

export async function bulkMovePromptsService(userId: string, promptIds: string[], collectionId: string | null) {
    // Check ownership for all prompts (optional but good security)
    const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, createdById: true, isLocked: true }
    });

    // Check locks
    const lockedInfo = prompts.find(p => p.isLocked && p.createdById !== userId);
    if (lockedInfo) {
        throw new Error(`Prompt ${lockedInfo.id} is locked by its creator.`);
    }

    // Relaxed permissions: allow moving any prompt if authenticated
    // verify prompts exist
    const validPromptIds = prompts.map(p => p.id);

    if (validPromptIds.length === 0) return;

    if (collectionId) {
        // Move to specific collection
        // Need to loop because each needs a unique ID based on the sequence
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
            select: { title: true }
        });
        const collectionName = collection?.title || "Unassigned";

        for (const id of validPromptIds) {
            const newTechId = await generateTechnicalId(collectionName);
            await prisma.prompt.update({
                where: { id },
                data: {
                    technicalId: newTechId,
                    collections: {
                        set: [{ id: collectionId }]
                    }
                } as any
            });
        }
    } else {
        // Move to root
        for (const id of validPromptIds) {
            const newTechId = await generateTechnicalId("Unassigned");
            await prisma.prompt.update({
                where: { id },
                data: {
                    technicalId: newTechId,
                    collections: {
                        set: []
                    }
                }
            });
        }
    }
}

export async function bulkAddTagsService(userId: string, promptIds: string[], tagIds: string[]) {
    if (promptIds.length === 0 || tagIds.length === 0) return;

    // Check ownership
    const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, createdById: true, isLocked: true }
    });

    // Check locks
    const lockedInfo = prompts.find(p => p.isLocked && p.createdById !== userId);
    if (lockedInfo) {
        throw new Error(`Prompt ${lockedInfo.id} is locked by its creator.`);
    }

    // Relaxed permissions: allow tagging any prompt if authenticated
    const validPromptIds = prompts.map(p => p.id);

    if (validPromptIds.length === 0) return;

    // Add tags (connect) - existing tags preserved
    await prisma.$transaction(
        validPromptIds.map(id => prisma.prompt.update({
            where: { id },
            data: {
                tags: {
                    connect: tagIds.map(tId => ({ id: tId }))
                }
            }
        }))
    );
}

export async function toggleLockService(userId: string, promptId: string) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
    });

    if (!prompt) throw new Error("Prompt not found");

    if (prompt.createdById !== userId) {
        throw new Error("Only the creator can lock/unlock this prompt.");
    }

    return prisma.prompt.update({
        where: { id: promptId },
        data: { isLocked: !prompt.isLocked }
    });
}

export async function toggleVisibilityService(userId: string, promptId: string) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
    });

    if (!prompt) throw new Error("Prompt not found");

    if (prompt.createdById !== userId) {
        throw new Error("Only the creator can change visibility.");
    }

    return prisma.prompt.update({
        where: { id: promptId },
        data: { isPrivate: !prompt.isPrivate }
    });
}

export async function searchPromptsForLinkingService(userId: string, query: string, excludeId: string) {
    try {
        fs.appendFileSync('debug_search.log', `[Service] search: query="${query}" user="${userId}"\n`);
    } catch (e) { }

    // Simple sanitization
    if (!query || query.length < 2) return [];

    // Get excluded IDs (self + already related)
    const exclusionList = [excludeId];

    if (excludeId) {
        const current = await prisma.prompt.findUnique({
            where: { id: excludeId },
            select: {
                relatedPrompts: { select: { id: true } },
                relatedToPrompts: { select: { id: true } }
            }
        });

        if (current) {
            current.relatedPrompts.forEach((p) => exclusionList.push(p.id));
            current.relatedToPrompts.forEach((p) => exclusionList.push(p.id));
        }
    }

    const prompts = await prisma.prompt.findMany({
        where: {
            createdById: userId,
            id: { notIn: exclusionList },
            OR: [
                {
                    AND: [
                        { isPrivate: false },
                        {
                            OR: [
                                { title: { contains: query } },
                                { technicalId: { contains: query } }
                            ]
                        }
                    ]
                },
                {
                    AND: [
                        { isPrivate: true },
                        { createdById: userId },
                        {
                            OR: [
                                { title: { contains: query } },
                                { technicalId: { contains: query } }
                            ]
                        }
                    ]
                }
            ]
        },
        select: {
            id: true,
            title: true,
            technicalId: true
        },
        take: 10
    });
    try {
        fs.appendFileSync('debug_search.log', `[Service] found ${prompts.length}\n`);
    } catch (e) { }
    return prompts;
}

export async function linkPromptsService(userId: string, promptIdA: string, promptIdB: string) {
    if (promptIdA === promptIdB) throw new Error("Cannot link prompt to itself");

    // Check ownership/permissions if strict, or just allowed for now
    // We'll rely on global access for now (or assume user has access to both)

    // Connect A to B. Prisma implicit M-N will handle the join table.
    // We connect A's relatedPrompts to B.
    await prisma.prompt.update({
        where: { id: promptIdA },
        data: {
            relatedPrompts: {
                connect: { id: promptIdB }
            }
        }
    });
}

export async function unlinkPromptsService(userId: string, promptIdA: string, promptIdB: string) {
    // Disconnect. 
    // We try to disconnect from both directions just in case, or check which way it was linked.
    // Actually, for implicit m-n, disconnecting A->B or B->A removes the entry from the join table.
    // BUT, we need to know which direction it was created in? 
    // Prisma implicit m-n: Only one table. A->B (A id, B id). 
    // So if we disconnect A->B it works. If it was B->A, we might need to try the other way?
    // Actually, `relatedPrompts` and `relatedToPrompts` represent the two sides.
    // Ideally we check if B is in A.relatedPrompts, disconnect; else if A is in B.relatedPrompts, disconnect.

    const promptA = await prisma.prompt.findUnique({
        where: { id: promptIdA },
        include: { relatedPrompts: { select: { id: true } } }
    });

    if (promptA?.relatedPrompts.some(p => p.id === promptIdB)) {
        await prisma.prompt.update({
            where: { id: promptIdA },
            data: {
                relatedPrompts: {
                    disconnect: { id: promptIdB }
                }
            }
        });
    } else {
        // Try the other direction
        await prisma.prompt.update({
            where: { id: promptIdB },
            data: {
                relatedPrompts: {
                    disconnect: { id: promptIdA }
                }
            }
        });
    }
}
