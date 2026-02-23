import { prisma } from "@/lib/prisma";

export async function searchPromptsForLinkingService(userId: string, query: string, excludeId: string) {
    if (!query || query.length < 2) return [];

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

    return prompts;
}

export async function linkPromptsService(userId: string, promptIdA: string, promptIdB: string) {
    if (promptIdA === promptIdB) throw new Error("Cannot link prompt to itself");
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
