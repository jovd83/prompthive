import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCollectionDescendantsService } from '@/services/collections';
import { bulkDeletePromptsService } from '@/services/prompts';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        collection: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        },
        prompt: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        favorite: {
            deleteMany: vi.fn(),
        },
        workflowStep: {
            deleteMany: vi.fn(),
        },
        tag: {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        }
    }
}));

// Mock Prompt Service Deps (cleanup and tags)
// We don't check expectations on these as they are internal, but we mock them if we can to avoid side effects
// Actually since we use 'actual' bulkDeletePromptsService in the same file, the mocks won't apply to internal calls.
// But we mock prisma used by them.

describe('Collection Descendants & Bulk Delete', () => {
    const userId = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getCollectionDescendantsService', () => {
        it('should return all descendant collection IDs and prompt IDs', async () => {
            // Setup Hierarchy: Root -> Child -> GrandChild
            // Prompts: p1 (Root), p2 (Child), p3 (GrandChild)

            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            // Mocks for BFS
            (prisma.collection.findUnique as any).mockResolvedValue({ id: 'root', ownerId: userId });

            (prisma.collection.findMany as any).mockImplementation(({ where }: any) => {
                if (where.parentId === 'root') return [{ id: 'child' }];
                if (where.parentId === 'child') return [{ id: 'grandchild' }];
                return [];
            });

            (prisma.prompt.findMany as any).mockImplementation(({ where }: any) => {
                // Expect query for targetCollectionIds
                // Just return prompts for all
                return [
                    { id: 'p1' }, { id: 'p2' }, { id: 'p3' }
                ];
            });

            const result = await getCollectionDescendantsService(userId, 'root');

            expect(result.collectionIds).toEqual(['child', 'grandchild']);
            expect(result.promptIds).toContain('p1');
            expect(result.promptIds).toContain('p2');
            expect(result.promptIds).toContain('p3');
            expect(result.promptIds.length).toBe(3);
        });
    });

    describe('bulkDeletePromptsService', () => {
        it('should call deleteMany for prompts', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            (prisma.prompt.findMany as any).mockResolvedValue([
                { id: 'p1', createdById: userId },
                { id: 'p2', createdById: userId },
            ]);

            // Mock cleanup finding nothing
            // Mock cleanup finding nothing
            (prisma.prompt.findUnique as any).mockResolvedValue(null);
            // Mock tag findMany for deleteUnusedTagsService
            (prisma.tag.findMany as any).mockResolvedValue([]);

            await bulkDeletePromptsService(userId, ['p1', 'p2']);

            expect(prisma.prompt.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['p1', 'p2'] } } });
        });
    });
});
