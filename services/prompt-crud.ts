import { prisma } from "@/lib/prisma";
import { generateTechnicalId } from "./id-service";
import { TagService } from "./tags";
import { PromptAttachmentService } from "./attachments";

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
    itemType?: string;
    repoUrl?: string;
    installCommand?: string;
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
    itemType?: string;
    repoUrl?: string;
    installCommand?: string;
};

export async function createPromptService(
    userId: string,
    input: CreatePromptInput,
    attachments: File[],
    resultImages: File[]
) {
    console.log("[Service] createPromptService called. prisma.prompt:", !!prisma?.prompt);
    const { savedAttachments, primaryResultImagePath } = await PromptAttachmentService.processAttachments(attachments, resultImages);

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
            description: input.description,
            resource: input.resource,
            itemType: input.itemType || "PROMPT",
            repoUrl: input.repoUrl,
            installCommand: input.installCommand,
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

    // --- SECURITY: Ownership Check (IDOR Prevention) ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (prompt.createdById !== userId && user?.role !== 'ADMIN') {
        throw new Error("Access denied: You do not own this prompt.");
    }

    // Lock check
    if (prompt.isLocked) {
        throw new Error("Prompt is locked. Unlock it to make changes.");
    }

    const nextVersionNumber = (prompt.versions[0]?.versionNumber || 0) + 1;
    const { savedAttachments, primaryResultImagePath } = await PromptAttachmentService.processAttachments(
        attachments,
        resultImages,
        input.keepAttachmentIds,
        input.keepResultImageIds,
        input.existingResultImagePath,
        input.promptId
    );

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

    const updateData: any = {
        currentVersionId: newVersion.id,
        title: input.title || undefined,
        description: input.description,
        resource: input.resource,
        isPrivate: input.isPrivate,
    };

    if (input.itemType !== undefined) updateData.itemType = input.itemType;
    if (input.repoUrl !== undefined) updateData.repoUrl = input.repoUrl;
    if (input.installCommand !== undefined) updateData.installCommand = input.installCommand;

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
        include: { versions: true }
    });

    if (!prompt) throw new Error("Prompt not found");

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
        collectionId: "",
        tagIds: undefined,
        keepAttachmentIds: attachmentIds,
        keepResultImageIds: resultImageIds,
        existingResultImagePath: sourceVersion.resultImage || "",
    };

    return createVersionService(userId, input, [], []);
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

    await PromptAttachmentService.cleanupPromptAssetsService(promptId);

    await prisma.favorite.deleteMany({
        where: { promptId }
    });

    await prisma.workflowStep.deleteMany({
        where: { promptId }
    });

    await prisma.prompt.delete({
        where: { id: promptId },
    });

    await TagService.cleanupTagsForPromptDelete(promptId);
}

export async function bulkDeletePromptsService(userId: string, promptIds: string[]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, createdById: true }
    });

    const validPrompts = prompts.filter(p => p.createdById === userId || isAdmin);
    const validIds = validPrompts.map(p => p.id);

    // Run cleanup for each prompt in parallel
    await Promise.allSettled(validIds.map(async (pid) => {
        await PromptAttachmentService.cleanupPromptAssetsService(pid);
        await prisma.favorite.deleteMany({ where: { promptId: pid } });
        await prisma.workflowStep.deleteMany({ where: { promptId: pid } });
    }));

    if (validIds.length > 0) {
        await prisma.prompt.deleteMany({
            where: { id: { in: validIds } }
        });
    }

    await TagService.deleteUnusedTagsService();

    return { count: validIds.length };
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
