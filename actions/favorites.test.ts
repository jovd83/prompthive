
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleFavorite, getFavorites } from './favorites';
import { getServerSession } from "next-auth";
import * as FavoritesService from "@/services/favorites";

// Mock dependencies
vi.mock("next-auth", () => ({
    getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
    authOptions: {},
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/services/favorites", () => ({
    toggleFavoriteService: vi.fn(),
    getFavoritesService: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        }
    }
}));
import { prisma } from "@/lib/prisma";

describe('Favorites Action', () => {
    const userId = 'user-1';
    const promptId = 'prompt-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toggleFavorite', () => {
        it('should throw Unauthorized if no session', async () => {
            (getServerSession as any).mockResolvedValue(null);
            await expect(toggleFavorite(promptId)).rejects.toThrow('Unauthorized');
        });

        it('should throw Session invalid if user not found in DB', async () => {
            (getServerSession as any).mockResolvedValue({ user: { id: userId } });
            (prisma.user.findUnique as any).mockResolvedValue(null);

            await expect(toggleFavorite(promptId)).rejects.toThrow('Session invalid');
        });

        it('should call service and return result if valid', async () => {
            (getServerSession as any).mockResolvedValue({ user: { id: userId } });
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId });
            (FavoritesService.toggleFavoriteService as any).mockResolvedValue({ isFavorite: true });

            const result = await toggleFavorite(promptId);

            expect(FavoritesService.toggleFavoriteService).toHaveBeenCalledWith(userId, promptId);
            expect(result).toEqual({ isFavorite: true });
        });
    });

    describe('getFavorites', () => {
        it('should return empty array if no session', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const result = await getFavorites();
            expect(result).toEqual([]);
        });

        it('should call service with params', async () => {
            (getServerSession as any).mockResolvedValue({ user: { id: userId } });
            (FavoritesService.getFavoritesService as any).mockResolvedValue([{ id: 'p1' }]);

            const result = await getFavorites('query', 'sort');

            expect(FavoritesService.getFavoritesService).toHaveBeenCalledWith(userId, 'query', 'sort');
            expect(result).toEqual([{ id: 'p1' }]);
        });
    });
});
