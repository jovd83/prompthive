import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveSettings, performBackup, checkAndRunAutoBackup, dropAllData, restoreLatestBackup } from './backup';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as BackupService from '@/services/backup';
import { revalidatePath } from 'next/cache';

// Mocks
vi.mock('next-auth');
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        settings: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}));

vi.mock('@/services/backup', () => ({
    saveSettingsService: vi.fn(),
    performBackupService: vi.fn(),
    dropAllDataService: vi.fn(),
    restoreLatestBackupService: vi.fn(),
}));

describe('Backup Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockSession = { user: { id: 'u-1' } };

    describe('saveSettings', () => {
        it('should save settings and revalidate', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            const formData = new FormData();
            formData.append('autoBackupEnabled', 'true');
            formData.append('backupPath', '/tmp/backups');
            formData.append('backupFrequency', 'DAILY');

            await saveSettings(formData);

            expect(BackupService.saveSettingsService).toHaveBeenCalledWith('u-1', {
                autoBackupEnabled: true,
                backupPath: '/tmp/backups',
                backupFrequency: 'DAILY'
            });
            expect(revalidatePath).toHaveBeenCalledWith('/settings');
        });

        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            await expect(saveSettings(new FormData())).rejects.toThrow('Unauthorized');
        });
    });

    describe('performBackup', () => {
        it('should perform backup if authorized', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (BackupService.performBackupService as any).mockResolvedValue(true);

            await performBackup('u-1', '/path');
            expect(BackupService.performBackupService).toHaveBeenCalledWith('u-1', '/path');
        });

        it('should throw if user mismatch', async () => {
            (getServerSession as any).mockResolvedValue(mockSession); // id: u-1
            await expect(performBackup('u-2', '/path')).rejects.toThrow('Unauthorized');
        });
    });

    describe('checkAndRunAutoBackup', () => {
        it('should do nothing if disabled or no path', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (prisma.settings.findUnique as any).mockResolvedValue({ autoBackupEnabled: false });

            await checkAndRunAutoBackup('u-1');
            expect(BackupService.performBackupService).not.toHaveBeenCalled();
        });

        it('should back up if DAILY and 25 hours passed', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            const lastBackup = new Date('2023-01-01T12:00:00Z');
            const now = new Date('2023-01-02T14:00:00Z'); // > 24h

            vi.setSystemTime(now);

            (prisma.settings.findUnique as any).mockResolvedValue({
                autoBackupEnabled: true,
                backupPath: '/path',
                backupFrequency: 'DAILY',
                lastBackupAt: lastBackup
            });
            (BackupService.performBackupService as any).mockResolvedValue(true);

            await checkAndRunAutoBackup('u-1');

            expect(BackupService.performBackupService).toHaveBeenCalled();
            expect(prisma.settings.update).toHaveBeenCalled();
        });

        it('should NOT back up if DAILY and only 1 hour passed', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            const lastBackup = new Date('2023-01-01T12:00:00Z');
            const now = new Date('2023-01-01T13:00:00Z'); // 1h

            vi.setSystemTime(now);

            (prisma.settings.findUnique as any).mockResolvedValue({
                autoBackupEnabled: true,
                backupPath: '/path',
                backupFrequency: 'DAILY',
                lastBackupAt: lastBackup
            });

            await checkAndRunAutoBackup('u-1');

            expect(BackupService.performBackupService).not.toHaveBeenCalled();
        });
    });

    describe('dropAllData', () => {
        it('should drop data and revalidate', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            await dropAllData();
            expect(BackupService.dropAllDataService).toHaveBeenCalledWith('u-1');
            expect(revalidatePath).toHaveBeenCalledWith('/');
        });
    });

    describe('restoreLatestBackup', () => {
        it('should restore checking settings path', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (prisma.settings.findUnique as any).mockResolvedValue({ backupPath: '/path' });

            await restoreLatestBackup();

            expect(BackupService.restoreLatestBackupService).toHaveBeenCalledWith('u-1', '/path');
            expect(revalidatePath).toHaveBeenCalledWith('/');
        });

        it('should throw if no path configured', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (prisma.settings.findUnique as any).mockResolvedValue({ backupPath: null });

            await expect(restoreLatestBackup()).rejects.toThrow('No backup path');
        });
    });
});
