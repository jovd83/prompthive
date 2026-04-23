import { Prisma } from "@prisma/client";

// Collection with recursive children and prompts
const collectionWithPrompts = Prisma.validator<Prisma.CollectionDefaultArgs>()({
    include: {
        prompts: {
            include: {
                tags: true,
            }
        },
        children: {
            include: {
                prompts: {
                    include: {
                        tags: true
                    }
                },
                children: true // One level deep for UI (e.g. badge counts)
            }
        },
        parent: true
    }
});

import { PromptDTO } from "@/lib/dto-mappers";

export type CollectionWithPrompts = Prisma.CollectionGetPayload<typeof collectionWithPrompts> & {
    breadcrumbs?: { id: string; title: string }[];
    totalPrompts?: number;
    _count?: { prompts: number };
    prompts: PromptDTO[];
    children: (Prisma.CollectionGetPayload<{ include: { prompts: true } }> & {
        totalPrompts?: number;
        _count?: { prompts: number };
    })[];
};

// Prompt with all relations needed for Editing/Viewing
// Note: We use a loose validator for now to avoid specific TS issues with self-relations
const promptWithRelations = Prisma.validator<Prisma.PromptDefaultArgs>()({
    include: {
        versions: {
            orderBy: { versionNumber: 'desc' },
            include: {
                attachments: true,
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        email: true
                    }
                }
            }
        },
        tags: true,
        collections: true, // Just basic collection info
        // relatedPrompts: true, 
        // relatedToPrompts: true,
        createdBy: {
            select: {
                id: true,
                username: true, // For 'Created By' display
                email: true
            }
        }
    }
});

export type PromptVersionWithRelations = Prisma.PromptVersionGetPayload<{
    include: {
        attachments: true,
        createdBy: {
            select: {
                id: true,
                username: true,
                email: true
            }
        }
    }
}>;

export type PromptWithRelations = Prisma.PromptGetPayload<typeof promptWithRelations> & {
    technicalId?: string | null;
    isLocked?: boolean;
    isPrivate?: boolean;
    resource?: string | null;
    currentVersionId?: string | null;
    viewCount?: number;
    copyCount?: number;
    relatedPrompts?: { id: string; title: string, technicalId: string | null }[];
    relatedToPrompts?: { id: string; title: string, technicalId: string | null }[];
    tags: { id: string; name: string; color: string | null; createdAt: Date }[];
    isFavorited?: boolean;
    favoritedBy?: { userId: string }[];
};

export type TagWithCount = {
    id: string;
    name: string;
    color: string | null;
    _count?: {
        prompts: number;
    };
};
