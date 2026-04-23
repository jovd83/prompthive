import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CollectionSplitView from "@/components/CollectionSplitView";
import { computeRecursiveCounts } from "@/lib/collection-utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHiddenUserIdsService, getSettingsService } from "@/services/settings";
import { CollectionWithPrompts, PromptWithRelations } from "@/types/prisma";
import { mapPromptToDTO } from "@/lib/dto-mappers";

export default async function CollectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ promptId?: string, sort?: string, order?: string }> }) {
    const { id } = await params;
    const { promptId, sort, order } = await searchParams;

    let orderBy: Prisma.PromptOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'alpha') {
        orderBy = { title: (order === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder };
    } else if (sort === 'date') {
        orderBy = { createdAt: (order === 'asc' ? 'asc' : 'desc') as Prisma.SortOrder };
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) notFound();

    const hiddenIds = await getHiddenUserIdsService(session.user.id);
    const visibleWhere = hiddenIds.length > 0 ? { createdById: { notIn: hiddenIds } } : {};

    let enhancedCollection;

    const promptInclude = {
        createdBy: { select: { email: true, username: true } },
        tags: true,
        favoritedBy: { where: { userId: session.user.id }, select: { userId: true } },
        versions: {
            orderBy: { versionNumber: "desc" as Prisma.SortOrder },
            take: 1,
            select: { content: true, resultImage: true, attachments: { select: { filePath: true, role: true } } }
        },
    };

    if (id === 'unassigned') {
        const prompts = await prisma.prompt.findMany({
            where: {
                collections: { none: {} },
                ...visibleWhere
            },
            include: promptInclude,
            orderBy: orderBy
        });

        const mappedPrompts = prompts.map(p => ({
            ...mapPromptToDTO(p as unknown as PromptWithRelations),
            isFavorited: (p as any).favoritedBy && (p as any).favoritedBy.length > 0
        }));

        enhancedCollection = {
            id: 'unassigned',
            title: 'No Collection',
            description: 'Prompts not assigned to any collection (Global)',
            prompts: mappedPrompts,
            children: [],
            parent: null,
            totalPrompts: prompts.length,
            ownerId: "",
            parentId: null,
            createdAt: new Date(0),
            _count: { prompts: prompts.length }
        };

    } else {
        const collection = await prisma.collection.findUnique({
            where: { id, ownerId: session.user.id },
            include: {
                prompts: {
                    where: visibleWhere,
                    include: promptInclude,
                    orderBy: orderBy
                },
                children: {
                    include: { _count: { select: { prompts: true } } }
                },
                parent: {
                    include: { _count: { select: { prompts: true } } }
                },
                _count: { select: { prompts: true } }
            },
        });

        if (!collection) notFound();

        const mappedPrompts = collection.prompts.map(p => ({
            ...mapPromptToDTO(p as unknown as PromptWithRelations),
            isFavorited: (p as any).favoritedBy && (p as any).favoritedBy.length > 0
        }));

        const allCollections = await prisma.collection.findMany({
            where: { ownerId: collection.ownerId },
            select: { id: true, parentId: true, title: true, createdAt: true, _count: { select: { prompts: true } } }
        });

        const countMap = computeRecursiveCounts(allCollections);

        const breadcrumbs = [];
        let currentParentId = collection.parentId;
        let depth = 0;
        while (currentParentId && depth < 10) {
            const parent = await prisma.collection.findUnique({
                where: { id: currentParentId },
                select: { id: true, title: true, parentId: true }
            });

            if (parent) {
                breadcrumbs.unshift({ id: parent.id, title: parent.title });
                currentParentId = parent.parentId;
            } else {
                break;
            }
            depth++;
        }

        enhancedCollection = {
            ...collection,
            prompts: mappedPrompts,
            breadcrumbs: breadcrumbs,
            totalPrompts: countMap.get(collection.id)?.totalPrompts || collection._count?.prompts || 0,
            children: collection.children.map(child => ({
                id: child.id,
                title: child.title,
                parentId: child.parentId,
                totalPrompts: countMap.get(child.id)?.totalPrompts || child._count?.prompts || 0
            })),
            parent: collection.parent ? {
                id: collection.parent.id,
                title: collection.parent.title,
                parentId: collection.parent.parentId,
                totalPrompts: countMap.get(collection.parent.id)?.totalPrompts || collection.parent._count?.prompts || 0
            } : null
        } as unknown as CollectionWithPrompts;
    }

    let selectedPrompt = null;
    if (promptId) {
        const rawPrompt = await prisma.prompt.findUnique({
            where: { id: promptId },
            include: {
                createdBy: { select: { email: true, username: true } },
                tags: true,
                favoritedBy: { where: { userId: session.user.id }, select: { userId: true } },
                versions: {
                    orderBy: { versionNumber: "desc" as Prisma.SortOrder },
                    select: {
                        content: true,
                        resultImage: true,
                        attachments: { select: { filePath: true, role: true } }
                    },
                },
                collections: { select: { id: true, title: true } },
                relatedPrompts: {
                    select: {
                        id: true,
                        title: true,
                        technicalId: true,
                        createdBy: { select: { username: true } }
                    }
                },
                relatedToPrompts: {
                    select: {
                        id: true,
                        title: true,
                        technicalId: true,
                        createdBy: { select: { username: true } }
                    }
                }
            },
        });
        if (rawPrompt) {
            const promptDTO = mapPromptToDTO(rawPrompt as unknown as PromptWithRelations);
            selectedPrompt = {
                ...promptDTO,
                isFavorited: rawPrompt.favoritedBy.length > 0,
                // Merge related
                relatedPrompts: [
                    ...rawPrompt.relatedPrompts,
                    ...rawPrompt.relatedToPrompts
                ].map(rp => mapPromptToDTO(rp as unknown as PromptWithRelations))
                    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
            };
        }
    }

    const isFavorited = selectedPrompt ? selectedPrompt.isFavorited : false;
    const collectionPath = enhancedCollection ? [...(enhancedCollection.breadcrumbs || []), { id: enhancedCollection.id, title: enhancedCollection.title }] : [];
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    const settings = await getSettingsService(session.user.id);

    let favoritedPromptIds: string[] = [];
    if (enhancedCollection && enhancedCollection.prompts) {
        favoritedPromptIds = (enhancedCollection.prompts as any[])
            .filter((p: any) => p.isFavorited)
            .map((p: any) => p.id);
    }

    return (
        <CollectionSplitView
            collection={enhancedCollection as any}
            selectedPrompt={selectedPrompt}
            promptId={promptId}
            currentUserId={session.user.id}
            collectionPath={collectionPath}
            isFavorited={isFavorited}
            tags={tags as any}
            tagColorsEnabled={(settings as any)?.tagColorsEnabled ?? true}
            favoritedPromptIds={favoritedPromptIds}
        />
    );
}
