import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollection, updateCollectionName, deleteCollection, moveCollection, updateCollectionDetails, emptyCollection } from './collections';
import * as CollectionsService from '@/services/collections';
import { getServerSession } from 'next-auth';

// Mocks
vi.mock('next-auth');
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));
vi.mock('@/services/collections');

describe('Collections Actions', () => {
    const mockSession = {
        user: {
            id: 'u1',
            role: 'USER',
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as any).mockResolvedValue(mockSession);
    });

    describe('createCollection', () => {
        it('creates collection and redirects', async () => {
            const formData = new FormData();
            formData.append('title', 'New Col');

            await createCollection({}, formData);

            expect(CollectionsService.createCollectionService).toHaveBeenCalledWith('u1', 'New Col', "", null);
        });

        it('returns error for invalid input', async () => {
            const formData = new FormData();
            // No title
            const result = await createCollection({}, formData);
            expect(result.errors).toBeDefined();
        });

        it('blocks guest users', async () => {
            (getServerSession as any).mockResolvedValue({ user: { id: 'u1', role: 'GUEST' } });
            const result = await createCollection({}, new FormData());
            expect(result.message).toContain('Unauthorized');
        });
    });

    describe('updateCollectionName', () => {
        it('updates name and revalidates', async () => {
            await updateCollectionName('c1', 'New Name');
            expect(CollectionsService.updateCollectionNameService).toHaveBeenCalledWith('u1', 'c1', 'New Name');
        });
    });

    describe('deleteCollection', () => {
        it('calls service', async () => {
            await deleteCollection('c1');
            expect(CollectionsService.deleteCollectionService).toHaveBeenCalledWith('u1', 'c1', false);
        });
    });
});
