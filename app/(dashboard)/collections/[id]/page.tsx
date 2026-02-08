import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CollectionSplitView from "@/components/CollectionSplitView";
import { computeRecursiveCounts } from "@/lib/collection-utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHiddenUserIdsService, getSettingsService } from "@/services/settings";

export default async function CollectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ promptId?: string, sort?: string, order?: string }> }) {
    const { id } = await params;
    const { promptId, sort, order } = await searchParams;

    // Define sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'alpha') {
        orderBy = { title: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'date') {
        orderBy = { createdAt: order === 'asc' ? 'asc' : 'desc' };
    } else if (sort === 'oldest') { // Handle specific "Oldest first" generic term if used, but SortControls uses 'date' + 'asc/desc'
        // sort=date&order=asc is handled above
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user) notFound(); // Should be handled by layout but good check

    const hiddenIds = await getHiddenUserIdsService(session.user.id);
    const visibleWhere = hiddenIds.length > 0 ? { createdById: { notIn: hiddenIds } } : {};

    let enhancedCollection;
    if (id === 'unassigned') {
        // Fetch global unassigned prompts
        const prompts = await prisma.prompt.findMany({
            where: {
                collections: { none: {} },
                ...visibleWhere
            },
            include: {
                createdBy: { select: { email: true, username: true } },
                tags: true,
                versions: {
                    orderBy: { versionNumber: "desc" },
                    take: 1,
                    select: { content: true, resultImage: true, attachments: { select: { filePath: true, role: true } } }
                },
                favoritedBy: { where: { userId: session.user.id } }
            },
            orderBy: orderBy
        });

        // Inject isFavorited
        const promptsWithFav = prompts.map(p => ({
            ...p,
            isFavorited: p.favoritedBy.length > 0
        }));

        enhancedCollection = {
            id: 'unassigned',
            title: 'No Collection',
            description: 'Prompts not assigned to any collection (Global)',
            prompts: promptsWithFav,
            children: [],
            parent: null,
            totalPrompts: prompts.length,
            ownerId: "", // Global (empty string for type compatibility)
            parentId: null,
            createdAt: new Date(0), // Epoch
            _count: { prompts: prompts.length }
        };

    } else {
        // Fetch the main full collection detail
        const collection = await prisma.collection.findUnique({
            where: { id },
            include: {
                prompts: {
                    where: visibleWhere,
                    include: {
                        createdBy: { select: { email: true, username: true } },
                        tags: true,
                        versions: {
                            orderBy: { versionNumber: "desc" },
                            take: 1,
                            select: { content: true, resultImage: true, attachments: { select: { filePath: true, role: true } } }
                        },
                        favoritedBy: { where: { userId: session.user.id } }
                    },
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

        (collection as any).prompts = collection.prompts.map(p => {
            const isFav = p.favoritedBy.length > 0;
            return {
                ...p,
                isFavorited: isFav
            };
        });

        // Fetch all collections lightweight to compute recursive counts
        // Only fetch related tree (same owner) for recursive counting efficiency, or just fetch all if we want global tree awareness?
        // Recursive counts usually only matter within the same tree. Distinct trees (users) don't intersect.
        const allCollections = await prisma.collection.findMany({
            where: { ownerId: collection.ownerId },
            select: { id: true, parentId: true, title: true, createdAt: true, _count: { select: { prompts: true } } }
        });

        const countMap = computeRecursiveCounts(allCollections);

        // Initialize breadcrumbs with current parent if available
        const breadcrumbs = [];
        let currentParentId = collection.parentId;

        // Iteratively fetch ancestors to build full breadcrumbs
        // Limit to 10 levels to prevent infinite loops
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

        // Inject recursive counts
        enhancedCollection = {
            ...collection,
            breadcrumbs: breadcrumbs,
            totalPrompts: countMap.get(collection.id)?.totalPrompts || collection._count?.prompts || 0,
            children: collection.children.map(child => ({
                ...child,
                totalPrompts: countMap.get(child.id)?.totalPrompts || child._count?.prompts || 0
            })),
            parent: collection.parent ? {
                ...collection.parent,
                totalPrompts: countMap.get(collection.parent.id)?.totalPrompts || collection.parent._count?.prompts || 0
            } : null
        };
    }

    let selectedPrompt = null;
    if (promptId) {
        selectedPrompt = await prisma.prompt.findUnique({
            where: { id: promptId },
            include: {
                versions: {
                    orderBy: { versionNumber: "desc" },
                    include: {
                        createdBy: true,
                        attachments: true,
                    },
                },
                createdBy: true,
                collections: true,
                tags: true,
                favoritedBy: { where: { userId: session.user.id } }
            },
        });
    }

    const isFavorited = selectedPrompt ? selectedPrompt.favoritedBy.length > 0 : false;

    const collectionPath = enhancedCollection ? [...(enhancedCollection.breadcrumbs || []), { id: enhancedCollection.id, title: enhancedCollection.title }] : [];

    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });

    const settings = await getSettingsService(session.user.id);

    return <CollectionSplitView collection={enhancedCollection as any} selectedPrompt={selectedPrompt} promptId={promptId} currentUserId={session.user.id} collectionPath={collectionPath} isFavorited={isFavorited} tags={tags as any} tagColorsEnabled={(settings as any)?.tagColorsEnabled ?? true} />;
}
