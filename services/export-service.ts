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
        itemType: string;
        repoUrl: string | null;
        installCommand: string | null;
        agentUsage: string | null;
        agentSkillIds: string | null;
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

    // 1. Initial Prompt Fetch
    const initialPrompts = await prisma.prompt.findMany({
        where: {
            createdById: userId,
            collections: {
                some: {
                    id: { in: collectionIds }
                }
            }
        },
        select: { id: true }
    });

    const allPromptIds = new Set(initialPrompts.map(p => p.id));

    // 2. Resolve skill dependencies recursively
    let changed = true;
    while (changed) {
        changed = false;
        const currentPromptIds = Array.from(allPromptIds);
        const versions = await prisma.promptVersion.findMany({
            where: {
                promptId: { in: currentPromptIds }
            },
            select: { agentSkillIds: true }
        });

        for (const v of versions) {
            if (v.agentSkillIds) {
                try {
                    const skillIds = JSON.parse(v.agentSkillIds) as string[];
                    for (const sid of skillIds) {
                        if (!allPromptIds.has(sid)) {
                            allPromptIds.add(sid);
                            changed = true;
                        }
                    }
                } catch (e) {}
            }
        }
    }

    // 3. Fetch final prompts with all relations
    const prompts = await prisma.prompt.findMany({
        where: {
            id: { in: Array.from(allPromptIds) }
            // Note: We don't filter by userId here for dependencies, 
            // as a prompt might reference a public skill or similar.
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
        }
    });

    const exportPrompts = prompts.map(p => {
        const latestVersion = p.versions[0];
        // Find a collectionId for this prompt that is in the exported set
        const relevantCollection = p.collections.find((c) => collectionIds.includes(c.id));
        const collectionId = relevantCollection ? relevantCollection.id : p.collections[0]?.id;

        const relatedPrompts = p.relatedPrompts?.map((rp) => rp.technicalId).filter((id): id is string => !!id);

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
            itemType: p.itemType,
            repoUrl: p.repoUrl,
            installCommand: p.installCommand,
            agentUsage: latestVersion?.agentUsage ?? "",
            agentSkillIds: latestVersion?.agentSkillIds ?? "[]",
            relatedPrompts
        };
    });

    // 4. Finalize collections (include those from dependencies)
    const neededCollectionIds = new Set(collectionIds);
    prompts.forEach(p => p.collections.forEach(c => neededCollectionIds.add(c.id)));

    const finalCollections = await prisma.collection.findMany({
        where: { id: { in: Array.from(neededCollectionIds) } },
        select: { id: true, title: true, parentId: true }
    });

    const exportCollections = finalCollections.map(c => ({
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
