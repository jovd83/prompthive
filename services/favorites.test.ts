
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavoriteService, getFavoritesService, isFavoriteService } from './favorites';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        favorite: {
            findUnique: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
    }
}));

describe('Favorites Service', () => {
    const userId = 'user-1';
    const promptId = 'prompt-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toggleFavoriteService', () => {
        it('should add favorite if not existing', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue(null);
            (prisma.favorite.create as any).mockResolvedValue({ userId, promptId });

            const result = await toggleFavoriteService(userId, promptId);

            expect(prisma.favorite.findUnique).toHaveBeenCalled();
            expect(prisma.favorite.create).toHaveBeenCalledWith({
                data: { userId, promptId }
            });
            expect(result).toEqual({ isFavorite: true });
        });

        it('should remove favorite if existing', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue({ userId, promptId });
            (prisma.favorite.delete as any).mockResolvedValue({ userId, promptId });

            const result = await toggleFavoriteService(userId, promptId);

            expect(prisma.favorite.delete).toHaveBeenCalledWith({
                where: { userId_promptId: { userId, promptId } }
            });
            expect(result).toEqual({ isFavorite: false });
        });
    });

    describe('getFavoritesService', () => {
        it('should fetch favorites with defaults', async () => {
            const mockFavorite = { prompt: { id: 'p1', title: 'T1' } };
            (prisma.favorite.findMany as any).mockResolvedValue([mockFavorite]);

            const result = await getFavoritesService(userId);

            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            }));
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(mockFavorite.prompt);
        });

        it('should apply sorting', async () => {
            await getFavoritesService(userId, undefined, 'date-asc');
            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { createdAt: 'asc' }
            }));

            await getFavoritesService(userId, undefined, 'alpha-asc');
            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { prompt: { title: 'asc' } }
            }));
        });

        it('should apply search query', async () => {
            await getFavoritesService(userId, 'search-term');
            expect(prisma.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    prompt: {
                        OR: [
                            { title: { contains: 'search-term' } },
                            { description: { contains: 'search-term' } }
                        ]
                    }
                })
            }));
        });
    });

    describe('isFavoriteService', () => {
        it('should return true if found', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue({ userId, promptId });
            const result = await isFavoriteService(userId, promptId);
            expect(result).toBe(true);
        });

        it('should return false if not found', async () => {
            (prisma.favorite.findUnique as any).mockResolvedValue(null);
            const result = await isFavoriteService(userId, promptId);
            expect(result).toBe(false);
        });
    });
});
