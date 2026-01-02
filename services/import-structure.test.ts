import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importStructureService } from './imports';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        collection: {
            findFirst: vi.fn(),
            create: vi.fn(),
        }
    }
}));

describe("importStructureService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should recreate a simple parent-child hierarchy", async () => {
        const userId = "user1";
        const definedCollections = [
            { id: "old_parent", title: "Parent", description: "P", parentId: null },
            { id: "old_child", title: "Child", description: "C", parentId: "old_parent" },
        ];

        // Mock Step 1: Create Parent
        (prisma.collection.findFirst as any).mockResolvedValueOnce(null); // Parent not found
        (prisma.collection.create as any).mockResolvedValueOnce({ id: "new_parent", title: "Parent" });

        // Mock Step 2: Create Child
        (prisma.collection.findFirst as any).mockResolvedValueOnce(null); // Child not found
        (prisma.collection.create as any).mockResolvedValueOnce({ id: "new_child", title: "Child", parentId: "new_parent" });

        const idMap = await importStructureService(userId, definedCollections);

        expect(prisma.collection.create).toHaveBeenCalledTimes(2);

        // Verify Parent Create
        expect(prisma.collection.create).toHaveBeenNthCalledWith(1, {
            data: { title: "Parent", description: "P", parentId: null, ownerId: userId }
        });

        // Verify Child Create with NEW Parent ID
        expect(prisma.collection.create).toHaveBeenNthCalledWith(2, {
            data: { title: "Child", description: "C", parentId: "new_parent", ownerId: userId }
        });

        expect(idMap).toEqual({
            "old_parent": "new_parent",
            "old_child": "new_child"
        });
    });

    it("should handle existing collections by reusing them", async () => {
        const userId = "user1";
        const definedCollections = [
            { id: "old_root", title: "Root", description: "", parentId: null }
        ];

        (prisma.collection.findFirst as any).mockResolvedValueOnce({ id: "existing_root", title: "Root" });

        const idMap = await importStructureService(userId, definedCollections);

        expect(prisma.collection.create).toHaveBeenCalledTimes(0);
        expect(idMap).toEqual({
            "old_root": "existing_root"
        });
    });
});
