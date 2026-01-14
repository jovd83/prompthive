import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as SettingsService from './settings';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        settings: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        globalConfiguration: {
            upsert: vi.fn()
        }
    }
}));

describe('Settings Service', () => {
    const userId = 'u-1';
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSettingsService', () => {
        it('should return existing settings', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue({ id: 's-1', userId });
            const res = await SettingsService.getSettingsService(userId);
            expect(res.id).toBe('s-1');
        });

        it('should create defaults if missing', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            (prisma.settings.create as any).mockResolvedValue({ id: 's-new', userId });

            const res = await SettingsService.getSettingsService(userId);
            expect(res.id).toBe('s-new');
            expect(prisma.settings.create).toHaveBeenCalled();
        });

        it('should return default object on P2003 error (user not found)', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            const err = new Error('FK Error');
            (err as any).code = 'P2003';
            (prisma.settings.create as any).mockRejectedValue(err);

            const res = await SettingsService.getSettingsService(userId);
            expect(res.id).toBe('transient');
        });

        it('should throw other errors', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            (prisma.settings.create as any).mockRejectedValue(new Error('DB Fail'));

            await expect(SettingsService.getSettingsService(userId)).rejects.toThrow('DB Fail');
        });
    });

    describe('updates', () => {
        it('updateGeneralSettingsService', async () => {
            await SettingsService.updateGeneralSettingsService(userId, { showPrompterTips: false, tagColorsEnabled: false, workflowVisible: true });
            expect(prisma.settings.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId },
                data: expect.objectContaining({ showPrompterTips: false })
            }));
        });

        it('updateVisibilitySettingsService', async () => {
            await SettingsService.updateVisibilitySettingsService(userId, ['u-2']);
            expect(prisma.settings.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { hiddenUsers: { set: [{ id: 'u-2' }] } }
            }));
        });

        it('updateCollectionVisibilitySettingsService', async () => {
            await SettingsService.updateCollectionVisibilitySettingsService(userId, ['c-2']);
            expect(prisma.settings.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { hiddenCollections: { set: [{ id: 'c-2' }] } }
            }));
        });

        it('updateGlobalSettingsService', async () => {
            await SettingsService.updateGlobalSettingsService({ registrationEnabled: true });
            expect(prisma.globalConfiguration.upsert).toHaveBeenCalled();
        });
    });

    describe('getters', () => {
        it('getHiddenUserIdsService', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue({ hiddenUsers: [{ id: 'u-2' }] });
            const res = await SettingsService.getHiddenUserIdsService(userId);
            expect(res).toEqual(['u-2']);
        });

        it('getHiddenCollectionIdsService', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue({ hiddenCollections: [{ id: 'c-2' }] });
            const res = await SettingsService.getHiddenCollectionIdsService(userId);
            expect(res).toEqual(['c-2']);
        });

        it('getHiddenUserIdsService returns empty if no settings', async () => {
            (prisma.settings.findUnique as any).mockResolvedValue(null);
            const res = await SettingsService.getHiddenUserIdsService(userId);
            expect(res).toEqual([]);
        });
    });
});
