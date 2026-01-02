
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import { validateFileExtension } from "./utils";
import { uploadFile, deleteFile } from "./files";
import { Prisma } from "@prisma/client";

export async function createTagService(name: string) {
    return prisma.tag.create({
        data: { name },
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
};

export async function createPromptService(
    userId: string,
    input: CreatePromptInput,
    attachments: File[],
    resultImages: File[]
) {
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

    const prompt = await prisma.prompt.create({
        data: {
            title: input.title,
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
        },
        include: { versions: true },
    });

    await prisma.prompt.update({
        where: { id: prompt.id },
        data: { currentVersionId: prompt.versions[0].id },
    });

    return prompt;
}

export type CreateVersionInput = {
    promptId: string;
    title: string;
    content: string;
    shortContent: string;
    usageExample: string;
    variableDefinitions: string;
    changelog: string;
    resultText: string;
    collectionId: string;
    description?: string;
    tagIds?: string[];
    keepAttachmentIds: string[];
    keepResultImageIds: string[];
    existingResultImagePath: string;
    resource?: string;
};

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
    const savedAttachments: { filePath: string; fileType: string; role?: string }[] = [];

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


    if (collectionId) {
        // Move to specific collection
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                collections: {
                    set: [{ id: collectionId }]
                }
            }
        });
    } else {
        // Move to root (remove from all collections)
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                collections: {
                    set: []
                }
            }
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
        // Prisma doesn't support updateMany with relations, so we use transaction or distinct updates
        // Since we are setting a relation, we can't use updateMany.
        await prisma.$transaction(
            validPromptIds.map(id => prisma.prompt.update({
                where: { id },
                data: {
                    collections: {
                        set: [{ id: collectionId }]
                    }
                }
            }))
        );
    } else {
        // Move to root
        await prisma.$transaction(
            validPromptIds.map(id => prisma.prompt.update({
                where: { id },
                data: {
                    collections: {
                        set: []
                    }
                }
            }))
        );
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
