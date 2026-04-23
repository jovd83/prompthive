import { prisma } from "@/lib/prisma";

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
