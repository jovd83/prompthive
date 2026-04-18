import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHiddenUserIdsService, getSettingsService } from "@/services/settings";
import { mapPromptToDTO } from "@/lib/dto-mappers";
import { PromptWithRelations } from "@/types/prisma";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getServerSession(authOptions);
    console.log("--- DASHBOARD DEBUG ---");
    console.log("User ID:", session?.user?.id);
    console.log("User Email:", session?.user?.email);

    const params = await searchParams;
    const sort = (params.sort as string) || "date";
    const order = (params.order as string) || "desc";
    const search = (params.q as string) || "";
    const tags = (params.tags as string) || "";
    const creator = (params.creator as string) || "";
    const mine = (params.mine as string) === "true";
    const page = parseInt((params.page as string) || "1", 10);
    const PAGE_SIZE = 12;

    const hasFilters = Boolean(search || tags || creator || mine || params.sort || params.page);

    // Fetch settings
    let hiddenIds: string[] = [];
    let showPrompterTips = true;
    let tagColorsEnabled = true;

    if (session?.user?.id) {
        const settings = await getSettingsService(session.user.id);
        hiddenIds = settings.hiddenUsers.map(u => u.id);
        showPrompterTips = settings.showPrompterTips ?? true;
        tagColorsEnabled = settings.tagColorsEnabled ?? true;
    }

    // Common WHERE clause for visibility
    const visibleWhere = hiddenIds.length > 0 ? { createdById: { notIn: hiddenIds } } : {};

    let prompts: PromptWithRelations[] = [];
    let searchResultsCount = 0;

    if (hasFilters) {
        // --- SEARCH RESULTS VIEW ---
        const where: Prisma.PromptWhereInput = {
            ...visibleWhere
        };

        if (search) {
            // ... (existing search logic, merged with where)
            where.AND = [
                visibleWhere,
                {
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } },
                        {
                            createdBy: {
                                OR: [
                                    { email: { contains: search } },
                                    { username: { contains: search } }
                                ]
                            }
                        },
                        {
                            tags: {
                                some: {
                                    name: { contains: search }
                                }
                            }
                        }
                    ]
                }
            ];
        } else {
            // If not search but other filters?
            // The original code constructed 'where' directly.
            // We need to be careful not to overwrite `where` if search is present.
            // Let's stick to the original logic structure but inject visibleWhere.
        }

        // RE-WRITING SEARCH LOGIC TO BE SAFE

        if (search) {
            where.AND = [
                visibleWhere,
                {
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } },
                        {
                            createdBy: {
                                OR: [
                                    { email: { contains: search } },
                                    { username: { contains: search } }
                                ]
                            }
                        },
                        {
                            tags: {
                                some: {
                                    name: { contains: search }
                                }
                            }
                        },
                        { technicalId: { contains: search } }
                    ]
                }
            ];
        }

        if (tags) {
            const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
            if (tagList.length > 0) {
                where.tags = {
                    some: {
                        OR: [
                            { id: { in: tagList } },
                            { name: { in: tagList } }
                        ]
                    }
                };
            }
        }

        if (creator) {
            where.createdBy = {
                OR: [
                    { email: { contains: creator } },
                    { username: { contains: creator } }
                ]
            };
        }

        if (mine && session?.user?.id) {
            where.OR = [
                { createdById: session.user.id },
                { interactions: { some: { userId: session.user.id } } }
            ];
        }

        // Merge visibility
        if (hiddenIds.length > 0) {
            where.createdById = { notIn: hiddenIds };
            // Note: If creator filter is set, it might conflict if that creator is hidden. 
            // The AND logic (implicit in top level props) handles this. 
            // If where.createdById is already set by 'creator' logic??
            // Wait, `creator` block uses `where.createdBy` relation. `visibleWhere` uses `createdById` field. 
            // Prisma allows both if they don't conflict fields. `createdBy` vs `createdById` are separate in where input usually.
        }

        const orderBy: Prisma.PromptOrderByWithRelationInput = {};
        if (sort === "date") orderBy.createdAt = order as Prisma.SortOrder;
        else if (sort === "alpha") orderBy.title = order as Prisma.SortOrder;
        else if (sort === "usage") orderBy.viewCount = order as Prisma.SortOrder;
        else if (sort === "recent") orderBy.updatedAt = order as Prisma.SortOrder;

        const [totalCount, searchPrompts] = await Promise.all([
            prisma.prompt.count({ where }),
            prisma.prompt.findMany({
                where,
                orderBy,
                take: PAGE_SIZE,
                skip: (page - 1) * PAGE_SIZE,
                include: {
                    createdBy: { select: { email: true, username: true } },
                    tags: true,
                    versions: {
                        orderBy: { versionNumber: "desc" },
                        take: 1,
                        include: { attachments: true }
                    }
                },
            }) as unknown as Promise<PromptWithRelations[]>
        ]);
        prompts = searchPrompts;
        searchResultsCount = totalCount;
    }

    // --- DASHBOARD VIEW (No filters) ---

    // 0. Favorites
    let favoritePrompts: any[] = [];
    let favoriteIds = new Set<string>();

    if (session?.user?.id) {
        const favs = await prisma.favorite.findMany({
            where: {
                userId: session.user.id,
                prompt: {
                    createdById: hiddenIds.length > 0 ? { notIn: hiddenIds } : undefined
                }
            },
            include: {
                prompt: {
                    include: {
                        createdBy: true,
                        tags: true,
                        versions: {
                            orderBy: { versionNumber: "desc" },
                            take: 1,
                            include: { attachments: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        favoritePrompts = favs.slice(0, 4).map(f => f.prompt);
        favoriteIds = new Set(favs.map(f => f.promptId));
    }

    // 1. Recently Used (Prompts I viewed or copied)
    let myRecentPrompts: any[] = [];
    if (session?.user?.id) {
        // Fetch interactions sorted by most recent
        const recentInteractions = await prisma.userPromptInteraction.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' },
            take: 4,
            include: {
                prompt: {
                    include: {
                        createdBy: { select: { email: true, username: true } },
                        tags: true,
                        versions: {
                            orderBy: { versionNumber: "desc" },
                            take: 1,
                            include: { attachments: true }
                        }
                    }
                }
            }
        });
        
        let recentPromptsFromInteractions = recentInteractions.map((i: any) => i.prompt);

        // Fallback: If no interactions yet, show prompts created by the user
        if (recentPromptsFromInteractions.length < 4) {
             const excludedIds = new Set<string>(recentPromptsFromInteractions.map((p: any) => p.id as string));
             const fallbackPrompts = await prisma.prompt.findMany({
                 where: { 
                     createdById: session.user.id,
                     id: { notIn: Array.from(excludedIds) }
                 },
                 orderBy: { updatedAt: 'desc' },
                 take: 4 - recentPromptsFromInteractions.length,
                 include: {
                     createdBy: { select: { email: true, username: true } },
                     tags: true,
                     versions: {
                         orderBy: { versionNumber: "desc" },
                         take: 1,
                         include: { attachments: true }
                     }
                 },
             });
             myRecentPrompts = [...recentPromptsFromInteractions, ...fallbackPrompts];
        } else {
             myRecentPrompts = recentPromptsFromInteractions;
        }
    }

    // 2. Newly Created (Global)
    const newPrompts = await prisma.prompt.findMany({
        where: visibleWhere,
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
            createdBy: { select: { email: true, username: true } },
            tags: true,
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
                include: { attachments: true }
            }
        },
    });

    // 3. Most Viewed (Global)
    const mostViewedPrompts = await prisma.prompt.findMany({
        where: visibleWhere,
        orderBy: { viewCount: 'desc' },
        take: 4,
        include: {
            createdBy: { select: { email: true, username: true } },
            tags: true,
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
                include: { attachments: true }
            }
        },
    });

    return (
        <DashboardContent
            searchParams={params}
            hasFilters={hasFilters}
            searchResults={prompts.map(mapPromptToDTO)}
            searchResultsCount={searchResultsCount}
            pageSize={PAGE_SIZE}
            favoritePrompts={(favoritePrompts as unknown as PromptWithRelations[]).map(mapPromptToDTO)}
            recentPrompts={(myRecentPrompts as unknown as PromptWithRelations[]).map(mapPromptToDTO)}
            newPrompts={(newPrompts as unknown as PromptWithRelations[]).map(mapPromptToDTO)}
            popularPrompts={(mostViewedPrompts as unknown as PromptWithRelations[]).map(mapPromptToDTO)}
            favoriteIds={Array.from(favoriteIds)}
            user={session?.user ? { name: session.user.name || "", id: session.user.id, role: session.user.role as string } : undefined}
            showPrompterTips={showPrompterTips}
            tagColorsEnabled={tagColorsEnabled}
        />
    );
}

