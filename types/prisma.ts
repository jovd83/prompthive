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

export type CollectionWithPrompts = Prisma.CollectionGetPayload<typeof collectionWithPrompts> & {
    breadcrumbs?: { id: string; title: string }[];
    totalPrompts?: number;
    _count?: { prompts: number };
    prompts: (Prisma.PromptGetPayload<{ include: { tags: true } }> & {
        _count?: { versions: number }; // sometimes we might need this
    })[];
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

export type PromptWithRelations = Omit<Prisma.PromptGetPayload<typeof promptWithRelations>, 'tags'> & {
    technicalId?: string | null;
    isLocked?: boolean;
    relatedPrompts?: { id: string; title: string, technicalId: string | null }[];
    relatedToPrompts?: { id: string; title: string, technicalId: string | null }[];
    tags: { id: string; name: string; color: string | null; createdAt: Date }[];
};

export type TagWithCount = {
    id: string;
    name: string;
    color: string | null;
    _count?: {
        prompts: number;
    };
};
