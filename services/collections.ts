
import { prisma } from "@/lib/prisma";
import { cleanupPromptAssetsService, deleteUnusedTagsService } from "./prompts";

export async function createCollectionService(userId: string, title: string, description: string, parentId: string | null) {
    const existing = await prisma.collection.findFirst({
        where: {
            ownerId: userId,
            title,
            parentId: parentId || null
        }
    });

    if (existing) {
        throw new Error("A collection with this name already exists in this folder.");
    }

    return prisma.collection.create({
        data: {
            title,
            description,
            ownerId: userId,
            parentId: parentId || null,
        },
    });
}

export async function moveCollectionService(userId: string, collectionId: string, newParentId: string | null) {
    // ... existed logic ...
    // Wait, user asked for constraint on move too? "constraint: create unique name".
    // "Een collection moet een unieke naam hebben als child..."
    // If I move "A" to a folder that has "A", it violates constraint.
    // I should check this too.

    // Original moveCollectionService content...
    if (collectionId === newParentId) {
        throw new Error("Cannot move a collection to itself.");
    }

    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
    });

    if (!collection) {
        throw new Error("Collection not found.");
    }

    // Check for unique name in destination
    const collision = await prisma.collection.findFirst({
        where: {
            title: collection.title,
            parentId: newParentId || null,
            id: { not: collectionId }
        }
    });

    if (collision) {
        throw new Error("A collection with this name already exists in the destination folder.");
    }

    if (newParentId) {
        let currentParentId: string | null = newParentId;
        let depth = 0;
        const maxDepth = 100;

        while (currentParentId && depth < maxDepth) {
            if (currentParentId === collectionId) {
                throw new Error("Cannot move a collection into its own descendant.");
            }
            const parent: { parentId: string | null } | null = await prisma.collection.findUnique({
                where: { id: currentParentId },
                select: { parentId: true }
            });
            currentParentId = parent?.parentId || null;
            depth++;
        }
    }

    await prisma.collection.update({
        where: { id: collectionId },
        data: { parentId: newParentId },
    });
}


export async function updateCollectionNameService(userId: string, collectionId: string, newName: string) {
    if (!newName.trim()) throw new Error("Name cannot be empty");

    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
    });

    if (!collection) {
        throw new Error("Collection not found");
    }

    const existing = await prisma.collection.findFirst({
        where: {
            title: newName,
            parentId: collection.parentId,
            id: { not: collectionId }
        }
    });

    if (existing) {
        throw new Error("A collection with this name already exists in this folder.");
    }

    await prisma.collection.update({
        where: { id: collectionId },
        data: { title: newName },
    });
}

export async function updateCollectionDetailsService(userId: string, collectionId: string, title: string, description: string | null) {
    if (!title.trim()) throw new Error("Name cannot be empty");

    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
    });

    if (!collection) {
        throw new Error("Collection not found");
    }

    const existing = await prisma.collection.findFirst({
        where: {
            title: title,
            parentId: collection.parentId,
            id: { not: collectionId }
        }
    });

    if (existing) {
        throw new Error("A collection with this name already exists in this folder.");
    }

    await prisma.collection.update({
        where: { id: collectionId },
        data: {
            title: title,
            description: description
        },
    });
}

export async function deleteCollectionService(userId: string, collectionId: string, deletePrompts: boolean = false) {
    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
        include: { children: true, prompts: true },
    });

    if (!collection) {
        throw new Error("Collection not found");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User prohibited");

    if (collection.ownerId !== userId && user.role !== 'ADMIN') {
        throw new Error("Access denied");
    }

    const parentId = collection.parentId;

    if (deletePrompts) {
        // Recursive Delete
        // 1. Fetch full hierarchy to delete from bottom up
        // Note: Prisma doesn't do deep cascading deletes on self-relations easily without raw queries or configured cascade behavior in DB.
        // We do it manually to ensure cleanupPromptAssetsService is called.

        // Helper to collect all descendant IDs (BFS or DFS)
        const getAllDescendants = async (rootId: string): Promise<string[]> => {
            const descendants: string[] = [];
            const queue = [rootId];
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = await prisma.collection.findMany({
                    where: { parentId: currentId },
                    select: { id: true }
                });
                for (const child of children) {
                    descendants.push(child.id);
                    queue.push(child.id);
                }
            }
            return descendants.reverse(); // Child before Parent
        };

        const allCollectionIdsToDelete = await getAllDescendants(collectionId);
        // Add root collection last (after children handled, though here we're building a list to iterate)
        // Actually, we want to delete prompts in all these collections, then delete the collections from bottom up.

        // 1. Delete prompts in all affected collections (including root)
        const targetCollectionIds = [...allCollectionIdsToDelete, collectionId];

        const allPrompts = await prisma.prompt.findMany({
            where: { collections: { some: { id: { in: targetCollectionIds } } } },
            select: { id: true }
        });

        // Unique prompts (in case of multi-collection, but here we're nuking the structure)
        const promptIds = Array.from(new Set(allPrompts.map(p => p.id)));

        for (const pid of promptIds) {
            await cleanupPromptAssetsService(pid);
            await prisma.prompt.delete({ where: { id: pid } });
        }
        await deleteUnusedTagsService();

        // 2. Delete collections from bottom up (children first)
        for (const cid of allCollectionIdsToDelete) {
            await prisma.collection.delete({ where: { id: cid } });
        }

        // 3. Delete root collection
        await prisma.collection.delete({
            where: { id: collectionId },
        });

    } else {
        // Reparenting Logic (Keep Contents)
        const parentId = collection.parentId;

        if (collection.children.length > 0) {
            await prisma.collection.updateMany({
                where: { parentId: collectionId },
                data: { parentId: parentId },
            });
        }

        const promptIds = collection.prompts.map(p => p.id);
        if (promptIds.length > 0) {
            if (parentId) {
                for (const pid of promptIds) {
                    await prisma.prompt.update({
                        where: { id: pid },
                        data: {
                            collections: { connect: { id: parentId } }
                        }
                    });
                }
            }
        }

        await prisma.collection.delete({
            where: { id: collectionId },
        });
    }

    return parentId;
}

export async function emptyCollectionService(userId: string, collectionId: string) {
    const collection = await prisma.collection.findUnique({
        where: { id: collectionId },
    });

    if (!collection) {
        throw new Error("Collection not found");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User prohibited");

    if (collection.ownerId !== userId && user.role !== 'ADMIN') {
        throw new Error("Access denied");
    }

    const prompts = await prisma.prompt.findMany({
        where: { collections: { some: { id: collectionId } } },
        select: { id: true }
    });

    for (const p of prompts) {
        await cleanupPromptAssetsService(p.id);
        await prisma.prompt.delete({ where: { id: p.id } });
    }

    await deleteUnusedTagsService();
}
