
import { prisma } from "@/lib/prisma";
import PromptDetail from "@/components/PromptDetail";
import { notFound } from "next/navigation";
import { computeRecursiveCounts } from "@/lib/collection-utils";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as FavoritesService from "@/services/favorites";
import { parseVariableDefinitions } from "@/lib/prompt-utils";
import { getSettingsService } from "@/services/settings";

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    let prompt = await prisma.prompt.findUnique({
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
            relatedPrompts: {
                select: {
                    id: true,
                    title: true,
                    technicalId: true,
                    description: true,
                    isLocked: true,
                    viewCount: true,
                    copyCount: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: { select: { email: true, username: true } },
                    tags: { select: { id: true, name: true, color: true } },
                    versions: {
                        orderBy: { versionNumber: "desc" },
                        take: 1,
                        select: {
                            content: true,
                            resultImage: true,
                            attachments: { select: { filePath: true, role: true } }
                        }
                    }
                }
            },
            relatedToPrompts: {
                select: {
                    id: true,
                    title: true,
                    technicalId: true,
                    description: true,
                    isLocked: true,
                    viewCount: true,
                    copyCount: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: { select: { email: true, username: true } },
                    tags: { select: { id: true, name: true, color: true } },
                    versions: {
                        orderBy: { versionNumber: "desc" },
                        take: 1,
                        select: {
                            content: true,
                            resultImage: true,
                            attachments: { select: { filePath: true, role: true } }
                        }
                    }
                }
            },
        },
    });

    if (!prompt) {
        // Try finding by Technical ID
        prompt = await prisma.prompt.findUnique({
            where: { technicalId: id } as any,
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
                relatedPrompts: {
                    select: {
                        id: true,
                        title: true,
                        technicalId: true,
                        description: true,
                        isLocked: true,
                        viewCount: true,
                        copyCount: true,
                        createdAt: true,
                        updatedAt: true,
                        createdBy: { select: { email: true, username: true } },
                        tags: true,
                        versions: {
                            orderBy: { versionNumber: "desc" },
                            take: 1,
                            select: {
                                content: true,
                                resultImage: true,
                                attachments: { select: { filePath: true, role: true } }
                            }
                        }
                    }
                },
                relatedToPrompts: {
                    select: {
                        id: true,
                        title: true,
                        technicalId: true,
                        description: true,
                        isLocked: true,
                        viewCount: true,
                        copyCount: true,
                        createdAt: true,
                        updatedAt: true,
                        createdBy: { select: { email: true, username: true } },
                        tags: true,
                        versions: {
                            orderBy: { versionNumber: "desc" },
                            take: 1,
                            select: {
                                content: true,
                                resultImage: true,
                                attachments: { select: { filePath: true, role: true } }
                            }
                        }
                    }
                },
            },
        });
    }

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

    // Merge bidirectional links
    const relatedPrompts = [
        ...prompt.relatedPrompts,
        ...prompt.relatedToPrompts
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Dedupe



    const promptWithCounts = {
        ...prompt,
        collections: enrichedCollections
    };

    // Calculate collection paths for breadcrumbs
    const collectionPaths = prompt.collections.map((col: any) => {
        const path = [];
        let current = col;
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

    const settings = session?.user?.id ? await getSettingsService(session.user.id) : null;
    const globalConfig = await prisma.globalConfiguration.findUnique({ where: { id: "GLOBAL" } });

    return <PromptDetail
        prompt={promptWithCounts}
        isFavorited={isFavorited}
        serverParsedVariables={serverParsedVariables}
        collectionPaths={collectionPaths}
        tagColorsEnabled={(settings as any)?.tagColorsEnabled ?? true}
        relatedPrompts={relatedPrompts}
        privatePromptsEnabled={globalConfig?.privatePromptsEnabled ?? false}
        currentUser={session?.user}
    />;
}
