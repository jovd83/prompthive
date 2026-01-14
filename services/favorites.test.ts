import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavoriteService, getFavoritesService, isFavoriteService } from './favorites';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        favorite: {
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
    },
}));

describe('Favorites Service', () => {
    const userId = 'user-123';
    const promptId = 'prompt-456';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toggleFavoriteService', () => {
        it('adds favorite if not exists', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue(null);
            (prisma.favorite.create as any).mockResolvedValue({ userId, promptId });

            const result = await toggleFavoriteService(userId, promptId);

            expect(prisma.favorite.findUnique).toHaveBeenCalled();
            expect(prisma.favorite.create).toHaveBeenCalled();
            expect(result).toEqual({ isFavorite: true });
        });

        it('removes favorite if exists', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue({ id: 'fav-1', userId, promptId });
            (prisma.favorite.delete as any).mockResolvedValue({ id: 'fav-1' });

            const result = await toggleFavoriteService(userId, promptId);

            expect(prisma.favorite.delete).toHaveBeenCalled();
            expect(result).toEqual({ isFavorite: false });
        });
    });

    describe('isFavoriteService', () => {
        it('returns true if favorite exists', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue({ id: 'fav-1' });
            const result = await isFavoriteService(userId, promptId);
            expect(result).toBe(true);
        });

        it('returns false if favorite does not exist', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue(null);
            const result = await isFavoriteService(userId, promptId);
            expect(result).toBe(false);
        });
    });

    describe('getFavoritesService', () => {
        it('returns list of favorited prompts', async () => {
            const mockFavorites = [
                {
                    prompt: { id: 'p1', title: 'Prompt 1' }
                }
            ];
            (prisma.favorite.findMany as any).mockResolvedValue(mockFavorites);

            const result = await getFavoritesService(userId);

            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId }
            }));
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('p1');
        });

        it('handles search query', async () => {
            (prisma.favorite.findMany as any).mockResolvedValue([]);
            await getFavoritesService(userId, 'searchterm');

            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    prompt: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { title: { contains: 'searchterm' } }
                        ])
                    })
                })
            }));
        });

        it('handles sort orders', async () => {
            (prisma.favorite.findMany as any).mockResolvedValue([]);
            await getFavoritesService(userId, undefined, 'alpha-asc');
            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { prompt: { title: 'asc' } }
            }));
        });
    });
});
