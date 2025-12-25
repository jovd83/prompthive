import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettingsService, updateVisibilitySettingsService, getHiddenUserIdsService } from './settings';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
    prisma: {
        settings: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        }
    }
}));

describe('Settings Service', () => {
    const userId = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSettingsService', () => {
        it('should return existing settings', async () => {
            const mockSettings = { id: 's-1', userId, hiddenUsers: [] };
            (prisma.settings.findUnique as any).mockResolvedValue(mockSettings);

            const result = await getSettingsService(userId);
            expect(result).toEqual(mockSettings);
        });

        it('should create default settings if not found', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            const mockCreated = { id: 's-new', userId, hiddenUsers: [] };
            (prisma.settings.create as any).mockResolvedValue(mockCreated);

            const result = await getSettingsService(userId);
            expect(prisma.settings.create).toHaveBeenCalled();
            expect(result).toEqual(mockCreated);
        });
    });

    describe('updateVisibilitySettingsService', () => {
        it('should update hidden users relation', async () => {
            const hiddenIds = ['u-2', 'u-3'];
            await updateVisibilitySettingsService(userId, hiddenIds);

            expect(prisma.settings.update).toHaveBeenCalledWith({
                where: { userId },
                data: {
                    hiddenUsers: {
                        set: [{ id: 'u-2' }, { id: 'u-3' }]
                    }
                }
            });
        });
    });

    describe('getHiddenUserIdsService', () => {
        it('should return ids list', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue({
                hiddenUsers: [{ id: 'u-2' }, { id: 'u-3' }]
            });

            const ids = await getHiddenUserIdsService(userId);
            expect(ids).toEqual(['u-2', 'u-3']);
        });

        it('should return empty list if settings not found (or no hidden users)', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            const ids = await getHiddenUserIdsService(userId);
            expect(ids).toEqual([]);
        });
    });
});
