import { prisma } from "@/lib/prisma";

export interface ZeroExportData {
    version: number;
    collections: {
        id: string;
        name: string;
        parentId: string | null;
    }[];
    prompts: {
        id: string;
        technicalId: string | null;
        title: string;
        description: string | null;
        content: string;
        shortPrompt: string;
        exampleOutput: string;
        expectedResult: string;
        tags: string[];
        collectionId: string | undefined;
        createdAt: Date;
        updatedAt: Date;
        relatedPrompts?: string[]; // List of Technical IDs
    }[];
}

export async function generateZeroExport(userId: string, collectionIds: string[]): Promise<ZeroExportData> {
    // Fetch selected collections
    const collections = await prisma.collection.findMany({
        where: {
            id: { in: collectionIds },
            ownerId: userId
        },
        select: {
            id: true,
            title: true,
            parentId: true
        }
    });

    // Fetch prompts in these collections
    const prompts = await prisma.prompt.findMany({
        where: {
            createdById: userId,
            collections: {
                some: {
                    id: { in: collectionIds }
                }
            }
        },
        include: {
            tags: true,
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1
            },
            collections: {
                select: { id: true }
            },
            relatedPrompts: {
                select: { technicalId: true }
            }
        } as any // Cast to any to bypass stale Prisma types
    });

    const exportPrompts = (prompts as any[]).map(p => {
        const latestVersion = p.versions[0];
        // Find a collectionId for this prompt that is in the exported set
        const relevantCollection = p.collections.find((c: any) => collectionIds.includes(c.id));
        const collectionId = relevantCollection ? relevantCollection.id : p.collections[0]?.id;

        const relatedPrompts = (p as any).relatedPrompts?.map((rp: any) => rp.technicalId).filter((id: any): id is string => !!id);

        return {
            id: p.id,
            technicalId: p.technicalId,
            title: p.title,
            description: p.description,
            content: latestVersion?.content || "",
            shortPrompt: latestVersion?.shortContent || "",
            exampleOutput: latestVersion?.usageExample || "",
            expectedResult: latestVersion?.resultText || "",
            tags: p.tags.map((t: any) => t.name),
            collectionId: collectionId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            relatedPrompts
        };
    });

    const exportCollections = collections.map(c => ({
        id: c.id,
        name: c.title,
        parentId: c.parentId
    }));

    return {
        version: 1,
        collections: exportCollections,
        prompts: exportPrompts
    };
}
