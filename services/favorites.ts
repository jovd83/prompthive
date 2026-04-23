
import { prisma } from "@/lib/prisma";

export async function toggleFavoriteService(userId: string, promptId: string) {
    const existing = await prisma.favorite.findUnique({
        where: {
            userId_promptId: {
                userId,
                promptId,
            },
        },
    });

    if (existing) {
        await prisma.favorite.delete({
            where: {
                userId_promptId: {
                    userId,
                    promptId,
                },
            },
        });
        return { isFavorite: false };
    } else {
        await prisma.favorite.create({
            data: {
                userId,
                promptId,
            },
        });
        return { isFavorite: true };
    }
}

export async function getFavoritesService(userId: string, query?: string, sort?: string) {
    let orderBy: any = { createdAt: "desc" };

    if (sort === "date-asc") orderBy = { createdAt: "asc" };
    if (sort === "alpha-asc") orderBy = { prompt: { title: "asc" } };
    if (sort === "alpha-desc") orderBy = { prompt: { title: "desc" } };

    const favorites = await prisma.favorite.findMany({
        where: {
            userId,
            ...(query ? {
                prompt: {
                    OR: [
                        { title: { contains: query } }, // removed case-insensitive mode for sqlite compatibility if needed, but Prisma usually handles it. 
                        // Actually Prisma/SQLite default contains is case-insensitive? No, depends. 
                        // But let's stick to standard contains for now.
                        { description: { contains: query } }
                    ]
                }
            } : {})
        },
        include: {
            prompt: {
                include: {
                    versions: {
                        orderBy: { versionNumber: "desc" },
                        take: 1
                    },
                    collections: true,
                    tags: true
                }
            }
        },
        orderBy: orderBy
    });

    return favorites.map(f => f.prompt);
}

export async function isFavoriteService(userId: string, promptId: string) {
    const favorite = await prisma.favorite.findUnique({
        where: {
            userId_promptId: {
                userId,
                promptId
            }
        }
    });

    return !!favorite;
}
