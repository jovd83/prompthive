
import { prisma } from "@/lib/prisma";
import PromptDetail from "@/components/PromptDetail";
import { notFound } from "next/navigation";
import { computeRecursiveCounts } from "@/lib/collection-utils";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as FavoritesService from "@/services/favorites";
import { parseVariableDefinitions } from "@/lib/prompt-utils";

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const prompt = await prisma.prompt.findUnique({
        where: { id },
        include: {
            versions: {
                orderBy: { versionNumber: "desc" },
                include: {
                    createdBy: true,
                    attachments: true,
                },
            },
            createdBy: true,
            collections: {
                include: {
                    _count: { select: { prompts: true } }, // Level 0 (Leaf)
                    parent: {
                        include: {
                            _count: { select: { prompts: true } }, // Level 1
                            parent: {
                                include: {
                                    _count: { select: { prompts: true } }, // Level 2
                                    parent: {
                                        include: {
                                            _count: { select: { prompts: true } }, // Level 3
                                            parent: {
                                                include: {
                                                    _count: { select: { prompts: true } }, // Level 4
                                                    parent: {
                                                        include: {
                                                            _count: { select: { prompts: true } } // Level 5
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            tags: true,
        },
    });

    if (!prompt) {
        notFound();
    }

    const isFavorited = session?.user?.id
        ? await FavoritesService.isFavoriteService(session.user.id, id)
        : false;

    const allCollections = await prisma.collection.findMany({
        where: { ownerId: prompt.createdById },
        select: { id: true, parentId: true, title: true, createdAt: true, _count: { select: { prompts: true } } }
    });

    const countMap = computeRecursiveCounts(allCollections);

    const enrichedCollections = prompt.collections.map((col: any) => {
        const enrichNode = (node: any): any => {
            if (!node) return null;
            return {
                ...node,
                totalPrompts: countMap.get(node.id)?.totalPrompts || node._count?.prompts || 0,
                parent: enrichNode(node.parent)
            };
        };
        return enrichNode(col);
    });

    const promptWithCounts = {
        ...prompt,
        collections: enrichedCollections
    };

    // Calculate collection paths for breadcrumbs
    const collectionPaths = prompt.collections.map((col: any) => {
        const path = [];
        let current = col;
        // Use the fetched prisma structure (col.parent) before enrichment replaced it?
        // Actually enrichedCollections preserves .parent structure (just adds counts).
        // Let's use enrichedCollections to match what we have. 
        // Wait, enrichedCollections is used for promptWithCounts.collections.
        // Let's use enrichedCollections for consistency in traversal.
        // But wait, my PromptDetail traversal change removed local calculation.
        // I should use enrichedCollections because it IS the tree structure.

        // HOWEVER, there's a risk enrichedCollections might not have parent if enrichNode failed.
        // Let's rely on Prisma 'prompt.collections' (col) since `prompt` variable holds the Raw Data with Includes.
        // Prisma object: col.parent.parent...

        current = col;
        while (current) {
            path.push({ id: current.id, title: current.title });
            current = current.parent;
        }
        return path.reverse();
    });

    // Parse variables for the current version safely on the server
    const currentVersionId = prompt.currentVersionId || prompt.versions[0]?.id;
    const currentVersion = prompt.versions.find(v => v.id === currentVersionId) || prompt.versions[0];
    const serverParsedVariables = parseVariableDefinitions(currentVersion?.variableDefinitions);

    return <PromptDetail
        prompt={promptWithCounts}
        isFavorited={isFavorited}
        serverParsedVariables={serverParsedVariables}
        collectionPaths={collectionPaths}
    />;
}
