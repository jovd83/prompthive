
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollectionService, moveCollectionService, deleteCollectionService, updateCollectionNameService, emptyCollectionService } from './collections';
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
vi.mock('./prompts', () => ({
    cleanupPromptAssetsService: vi.fn(),
    deleteUnusedTagsService: vi.fn(),
}));

describe('Collections Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createCollectionService', () => {
        it('should create a collection', async () => {
            (prisma.collection.create as any).mockResolvedValue({ id: 'col-1', title: 'Test' });

            await createCollectionService(userId, 'Test', 'Desc', null);

            expect(prisma.collection.create).toHaveBeenCalledWith({
                data: {
                    title: 'Test',
                    description: 'Desc',
                    ownerId: userId,
                    parentId: null,
                }
            });
        });
    });

    describe('moveCollectionService', () => {
        it('should error if moving to itself', async () => {
            await expect(moveCollectionService(userId, 'col-1', 'col-1'))
                .rejects.toThrow("Cannot move a collection to itself");
        });

        it('should error if cycle detected', async () => {
            (prisma.collection.findUnique as any).mockImplementation(({ where }: any) => {
                if (where.id === 'col-1') return { id: 'col-1', ownerId: userId };
                if (where.id === 'col-child') return { id: 'col-child', parentId: 'col-1' }; // child points to parent
                return null;
            });

            // Attempt to move col-1 into col-child (which is its child)
            await expect(moveCollectionService(userId, 'col-1', 'col-child'))
                .rejects.toThrow("Cannot move a collection into its own descendant");
        });

        it('should move successfully if valid', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue({ id: 'col-1', ownerId: userId });

            await moveCollectionService(userId, 'col-1', 'new-parent');

            expect(prisma.collection.update).toHaveBeenCalledWith({
                where: { id: 'col-1' },
                data: { parentId: 'new-parent' }
            });
        });
    });

    describe('updateCollectionNameService', () => {
        it('should throw if name is empty', async () => {
            await expect(updateCollectionNameService(userId, 'col-1', '  '))
                .rejects.toThrow('Name cannot be empty');
        });

        it('should throw if collection not found or denied', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue(null);
            await expect(updateCollectionNameService(userId, 'col-1', 'New Name'))
                .rejects.toThrow('Collection not found');
        });

        it('should throw if name collision occurs', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue({ id: 'col-1', ownerId: userId, parentId: null });
            (prisma.collection.findFirst as any).mockResolvedValue({ id: 'col-2' }); // exists

            await expect(updateCollectionNameService(userId, 'col-1', 'New Name'))
                .rejects.toThrow('A collection with this name already exists in this folder.');
        });
    });

    describe('deleteCollectionService', () => {
        it('should throw if collection not found', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue(null);
            await expect(deleteCollectionService(userId, 'col-1'))
                .rejects.toThrow('Collection not found');
        });

        it('should reparent children and delete collection', async () => {
            const mockCollection = {
                id: 'col-1',
                ownerId: userId,
                parentId: 'root-id',
                children: [{ id: 'child-1' }],
                prompts: [{ id: 'p-1' }]
            };
            (prisma.collection.findUnique as any).mockResolvedValue(mockCollection);
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            await deleteCollectionService(userId, 'col-1', false);

            expect(prisma.collection.updateMany).toHaveBeenCalledWith({
                where: { parentId: 'col-1' },
                data: { parentId: 'root-id' }
            });

            expect(prisma.prompt.update).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                data: { collections: { connect: { id: 'root-id' } } }
            });

            expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'col-1' } });
        });

        it('should delete prompts if deletePrompts is true', async () => {
            const mockCollection = {
                id: 'col-1',
                ownerId: userId,
                parentId: 'root-id',
                children: [],
                prompts: []
            };
            (prisma.collection.findUnique as any).mockResolvedValue(mockCollection);
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            (prisma.prompt.findMany as any).mockResolvedValue([{ id: 'p-1' }]);

            await deleteCollectionService(userId, 'col-1', true);

            expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
            expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'col-1' } });
        });

        it('should allow ADMIN to delete other users collection', async () => {
            const mockCollection = {
                id: 'col-1',
                ownerId: 'other-user',
                parentId: 'root-id',
                children: [],
                prompts: []
            };
            (prisma.collection.findUnique as any).mockResolvedValue(mockCollection);
            (prisma.user.findUnique as any).mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

            await deleteCollectionService('admin-1', 'col-1', false);

            expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'col-1' } });
        });
    });

    describe('emptyCollectionService', () => {
        it('should throw if access denied', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue({ id: 'col-1', ownerId: 'other-user' });
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            await expect(emptyCollectionService(userId, 'col-1'))
                .rejects.toThrow('Access denied');
        });

        it('should delete all prompts in collection', async () => {
            (prisma.collection.findUnique as any).mockResolvedValue({ id: 'col-1', ownerId: userId });
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });
            (prisma.prompt.findMany as any).mockResolvedValue([{ id: 'p-1' }]);

            await emptyCollectionService(userId, 'col-1');

            expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
        });
    });
});
