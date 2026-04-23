import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getCachedTags = unstable_cache(
    async () => {
        return prisma.tag.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { prompts: true }
                }
            }
        });
    },
    ['global-tags'],
    { revalidate: 60, tags: ['tags'] } // Cache for 1 minute or until invalidated
);

export const getCachedCollections = unstable_cache(
    async () => {
        return prisma.collection.findMany({
            orderBy: { title: "asc" },
            include: {
                _count: {
                    select: { prompts: true }
                },
                parent: true,
                children: {
                    include: {
                        _count: { select: { prompts: true } },
                        children: true
                    }
                }
            }
        });
    },
    ['global-collections'],
    { revalidate: 60, tags: ['collections'] }
);

export const getCachedUnassignedCount = unstable_cache(
    async () => {
        return prisma.prompt.count({
            where: {
                collections: {
                    none: {}
                }
            }
        });
    },
    ['unassigned-count'],
    { revalidate: 60, tags: ['prompts', 'collections'] }
);
