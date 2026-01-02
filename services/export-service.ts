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
        title: string;
        description: string | null;
        body: string;
        shortPrompt: string;
        exampleOutput: string;
        expectedResult: string;
        tags: string[];
        collectionId: string | undefined;
        createdAt: Date;
        updatedAt: Date;
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
            }
        }
    });

    const exportPrompts = prompts.map(p => {
        const latestVersion = p.versions[0];
        // Find a collectionId for this prompt that is in the exported set
        const relevantCollection = p.collections.find(c => collectionIds.includes(c.id));
        const collectionId = relevantCollection ? relevantCollection.id : p.collections[0]?.id;

        return {
            id: p.id,
            title: p.title,
            description: p.description,
            body: latestVersion?.content || "",
            shortPrompt: latestVersion?.shortContent || "",
            exampleOutput: latestVersion?.usageExample || "",
            expectedResult: latestVersion?.resultText || "",
            tags: p.tags.map(t => t.name),
            collectionId: collectionId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
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
