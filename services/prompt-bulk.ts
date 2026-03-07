import { prisma } from "@/lib/prisma";
import { generateTechnicalId } from "./id-service";

export async function movePromptService(userId: string, promptId: string, collectionId: string | null) {
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: { collections: true }
    });

    if (!prompt) throw new Error("Prompt not found");

    // --- SECURITY: Ownership Check (IDOR Prevention) ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';
    if (prompt.createdById !== userId && !isAdmin) {
        throw new Error("Access denied: You do not own this prompt.");
    }

    if (prompt.isLocked && !isAdmin) {
        throw new Error("Prompt is locked by the creator.");
    }

    let newTechnicalId: string | undefined = undefined;

    if (collectionId) {
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId },
            select: { title: true }
        });
        if (collection) {
            newTechnicalId = await generateTechnicalId(collection.title);
        }
    } else {
        newTechnicalId = await generateTechnicalId("Unassigned");
    }

    if (collectionId) {
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                technicalId: newTechnicalId,
                collections: {
                    set: [{ id: collectionId }]
                }
            }
        });
    } else {
        await prisma.prompt.update({
            where: { id: promptId },
            data: {
                technicalId: newTechnicalId,
                collections: {
                    set: []
                }
            }
        });
    }
}

export async function bulkMovePromptsService(userId: string, promptIds: string[], collectionId: string | null) {
    const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, createdById: true, isLocked: true }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    const validPromptIds = prompts.filter(p => p.createdById === userId || isAdmin).map(p => p.id);
    if (validPromptIds.length === 0) {
        throw new Error("Access denied or no prompts selected.");
    }

    const lockedInfo = prompts.find(p => p.isLocked && !isAdmin);
    if (lockedInfo) {
        throw new Error(`Prompt ${lockedInfo.id} is locked by its creator.`);
    }

    if (collectionId) {
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
                }
            });
        }
    } else {
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

    const prompts = await prisma.prompt.findMany({
        where: { id: { in: promptIds } },
        select: { id: true, createdById: true, isLocked: true }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN';

    const validPromptIds = prompts.filter(p => p.createdById === userId || isAdmin).map(p => p.id);
    if (validPromptIds.length === 0) {
        throw new Error("Access denied or no prompts selected.");
    }

    const lockedInfo = prompts.find(p => p.isLocked && !isAdmin);
    if (lockedInfo) {
        throw new Error(`Prompt ${lockedInfo.id} is locked by its creator.`);
    }

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
