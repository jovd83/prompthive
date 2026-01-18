import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteCollectionService } from '@/services/collections';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        collection: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            delete: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(), // Added findMany for recursion
        },
        prompt: {
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        }
    }
}));

// Mock Dependencies
vi.mock('@/services/prompts', () => ({
    cleanupPromptAssetsService: vi.fn(),
    deleteUnusedTagsService: vi.fn(),
}));

describe('Reproduction: Recursive Collection Deletion', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should recursively delete child collections and prompts when deletePrompts is true', async () => {
        // Structure: Parent -> Child -> Grandchild
        // Prompts in each.

        // Mock finding the parent collection
        const mockParentCollection = {
            id: 'parent-1',
            ownerId: userId,
            parentId: null,
            children: [{ id: 'child-1' }],
            prompts: [{ id: 'p-parent' }]
        };

        // Mock finding the child collection (during recursion)
        const mockChildCollection = {
            id: 'child-1',
            ownerId: userId,
            parentId: 'parent-1',
            children: [{ id: 'grandchild-1' }],
            prompts: [{ id: 'p-child' }]
        };

        // Mock finding the grandchild collection (during recursion)
        const mockGrandchildCollection = {
            id: 'grandchild-1',
            ownerId: userId,
            parentId: 'child-1',
            children: [],
            prompts: [{ id: 'p-grandchild' }]
        };

        (prisma.collection.findUnique as any).mockImplementation(({ where }: any) => {
            if (where.id === 'parent-1') return Promise.resolve(mockParentCollection);
            if (where.id === 'child-1') return Promise.resolve(mockChildCollection);
            if (where.id === 'grandchild-1') return Promise.resolve(mockGrandchildCollection);
            return Promise.resolve(null);
        });

        // Mock collection.findMany for recursion
        (prisma.collection.findMany as any).mockImplementation(({ where }: any) => {
            if (where.parentId === 'parent-1') return Promise.resolve([{ id: 'child-1' }]);
            if (where.parentId === 'child-1') return Promise.resolve([{ id: 'grandchild-1' }]);
            if (where.parentId === 'grandchild-1') return Promise.resolve([]);
            return Promise.resolve([]);
        });

        (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

        // Mock prompts lookup
        (prisma.prompt.findMany as any).mockImplementation(({ where }: any) => {
            // Logic for recursive prompts lookup
            // The service calls findMany with { where: { collections: { some: { id: { in: [...] } } } } }

            // Check if looking for prompts in specific collections via 'in' or single collection
            // The new code implementation uses `id: { in: targetCollectionIds }`
            const idsObj = where.collections?.some?.id;

            // If checking 'in'
            if (idsObj && idsObj.in) {
                const ids = idsObj.in as string[];
                const results = [];
                if (ids.includes('parent-1')) results.push({ id: 'p-parent' });
                if (ids.includes('child-1')) results.push({ id: 'p-child' });
                if (ids.includes('grandchild-1')) results.push({ id: 'p-grandchild' });
                return Promise.resolve(results);
            }

            // Fallback (if any other query)
            if (where.collections?.some?.id === 'parent-1') return Promise.resolve([{ id: 'p-parent' }]);
            return Promise.resolve([]);
        });

        await deleteCollectionService(userId, 'parent-1', true);

        // EXPECTATION: Recursive deletion
        expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'grandchild-1' } });
        expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'child-1' } });
        expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'parent-1' } });

        expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-grandchild' } });
        expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-child' } });
        expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-parent' } });
    });
});
