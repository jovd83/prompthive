import { prisma } from "@/lib/prisma";
import PromptDetail from "@/components/PromptDetail";
import { notFound } from "next/navigation";
import { computeRecursiveCounts } from "@/lib/collection-utils";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as FavoritesService from "@/services/favorites";
import { parseVariableDefinitions } from "@/lib/prompt-utils";
import { getSettingsService } from "@/services/settings";
import { mapPromptToDTO } from "@/lib/dto-mappers";
import { PromptWithRelations } from "@/types/prisma";

export default async function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const commonInclude = {
        versions: {
            orderBy: { versionNumber: "desc" as const },
            include: {
                createdBy: { select: { id: true, username: true, email: true } },
                attachments: true,
            },
        },
        createdBy: { select: { id: true, username: true, email: true } },
        collections: {
            include: {
                _count: { select: { prompts: true } },
                parent: {
                    include: {
                        _count: { select: { prompts: true } },
                        parent: {
                            include: {
                                _count: { select: { prompts: true } },
                                parent: {
                                    include: {
                                        _count: { select: { prompts: true } },
                                        parent: {
                                            include: {
                                                _count: { select: { prompts: true } },
                                                parent: {
                                                    include: {
                                                        _count: { select: { prompts: true } }
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
                    orderBy: { versionNumber: "desc" as const },
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
                    orderBy: { versionNumber: "desc" as const },
                    take: 1,
                    select: {
                        content: true,
                        resultImage: true,
                        attachments: { select: { filePath: true, role: true } }
                    }
                }
            }
        },
    };

    let prompt = await prisma.prompt.findUnique({
        where: { id },
        include: commonInclude,
    });

    if (!prompt) {
        prompt = await prisma.prompt.findUnique({
            where: { technicalId: id },
            include: commonInclude,
        });
    }

    if (!prompt) {
        notFound();
    }

    // --- SECURITY: Privacy & Ownership Check (IDOR Prevention) ---
    const currentUserId = session?.user?.id;
    const isCreator = currentUserId === prompt.createdById;
    const isAdmin = session?.user?.role === 'ADMIN';

    // If prompt is private and the user is neither the creator nor an admin, deny access.
    if (prompt.isPrivate && !isCreator && !isAdmin) {
        notFound(); // Return 404 to hide existence of private resource
    }

    const isFavorited = currentUserId
        ? await FavoritesService.isFavoriteService(currentUserId, prompt.id)
        : false;

    const allCollections = await prisma.collection.findMany({
        where: { ownerId: prompt.createdById },
        select: { id: true, parentId: true, title: true, createdAt: true, _count: { select: { prompts: true } } }
    });

    const countMap = computeRecursiveCounts(allCollections);

    const enrichedCollections = prompt.collections.map((col) => {
        const enrichNode = (node: any): { id: string; title: string; totalPrompts: number; parent: any } | null => {
            if (!node) return null;
            return {
                id: node.id,
                title: node.title,
                totalPrompts: countMap.get(node.id)?.totalPrompts || node._count?.prompts || 0,
                parent: enrichNode(node.parent)
            };
        };
        return enrichNode(col);
    }).filter(Boolean);

    const relatedPromptsRaw = [
        ...prompt.relatedPrompts,
        ...prompt.relatedToPrompts
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    const relatedPromptsDTO = relatedPromptsRaw.map(rp => mapPromptToDTO(rp as unknown as PromptWithRelations));

    const collectionPaths = prompt.collections.map((col) => {
        const path = [];
        let current: any = col;
        while (current) {
            path.push({ id: current.id as string, title: current.title as string });
            current = current.parent;
        }
        return path.reverse();
    });

    const currentVersionId = prompt.currentVersionId || prompt.versions[0]?.id;
    const currentVersion = prompt.versions.find(v => v.id === currentVersionId) || prompt.versions[0];
    const serverParsedVariables = parseVariableDefinitions(currentVersion?.variableDefinitions);

    const settings = session?.user?.id ? await getSettingsService(session.user.id) : null;
    const globalConfig = await prisma.globalConfiguration.findUnique({ where: { id: "GLOBAL" } });

    // Fetch details for all agent skills referenced by ANY version
    const allSkillIds = new Set<string>();
    prompt.versions.forEach((v: any) => {
        if (v.agentSkillIds) {
            try {
                const ids = JSON.parse(v.agentSkillIds);
                if (Array.isArray(ids)) ids.forEach(id => {
                    if (typeof id === 'string') allSkillIds.add(id);
                });
            } catch (e) {}
        }
    });

    let selectedAgentSkills: any[] = [];
    if (allSkillIds.size > 0) {
        selectedAgentSkills = await prisma.prompt.findMany({
            where: { id: { in: Array.from(allSkillIds) } },
            include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
        });
    }

    // Apply DTO mapping for the prompt itself
    const promptDTO = mapPromptToDTO(prompt as unknown as PromptWithRelations);

    return <PromptDetail
        prompt={{
            ...promptDTO,
            collections: enrichedCollections as any // Keeping as any for now until PromptDTO collections is fully compatible
        }}
        selectedAgentSkills={selectedAgentSkills}
        isFavorited={isFavorited}
        serverParsedVariables={serverParsedVariables}
        collectionPaths={collectionPaths}
        tagColorsEnabled={settings?.tagColorsEnabled ?? true}
        relatedPrompts={relatedPromptsDTO}
        privatePromptsEnabled={globalConfig?.privatePromptsEnabled ?? false}
        currentUser={session?.user ? { id: session.user.id, role: session.user.role || 'USER', name: session.user.name, email: session.user.email } : undefined}
    />;
}
