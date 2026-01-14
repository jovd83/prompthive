
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveSettingsService, performBackupService, dropAllDataService, restoreLatestBackupService } from './backup';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        settings: {
            upsert: vi.fn(),
            findUnique: vi.fn(),
        },
        collection: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        prompt: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            deleteMany: vi.fn(),
        },
        tag: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            deleteMany: vi.fn(),
        },
        promptVersion: {
            deleteMany: vi.fn(),
        }
    }
}));

// Mock fs and path
vi.mock('fs/promises', () => ({
    default: {
        readdir: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        mkdir: vi.fn(),
    }
}));
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
}));

describe('Backup Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveSettingsService', () => {
        it('should upsert settings', async () => {
            const data = { autoBackupEnabled: true, backupPath: '/backups', backupFrequency: 'daily' };
            await saveSettingsService(userId, data);
            expect(prisma.settings.upsert).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId },
                create: expect.objectContaining({ autoBackupEnabled: true }),
                update: expect.objectContaining({ autoBackupEnabled: true }),
            }));
        });
    });

    describe('performBackupService', () => {
        it('should fetch data and write backup file', async () => {
            // Mock data
            (prisma.collection.findMany as any).mockResolvedValue([{ id: 'c1', title: 'Col 1' }]);
            (prisma.prompt.findMany as any).mockResolvedValue([{
                id: 'p1',
                versions: [{ id: 'v1', attachments: [] }],
                tags: []
            }]);
            (prisma.tag.findMany as any).mockResolvedValue([]);
            (prisma.settings.findUnique as any).mockResolvedValue({});

            // Mock FS
            (fs.mkdir as any).mockResolvedValue(undefined);
            (fs.writeFile as any).mockResolvedValue(undefined);

            // Mock implicit require('fs') used in helper
            const fsSync = await import('fs');
            (fsSync as any).existsSync.mockReturnValue(false);

            const result = await performBackupService(userId, '/tmp/backups');

            expect(result).toBe(true);
            expect(fs.writeFile).toHaveBeenCalled();
            expect(prisma.prompt.findMany).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            (prisma.collection.findMany as any).mockRejectedValue(new Error("DB Error"));
            const result = await performBackupService(userId, '/tmp/backups');
            expect(result).toBe(false);
        });
    });

    describe('dropAllDataService', () => {
        it('should delete all data in correct order', async () => {
            await dropAllDataService(userId);
            expect(prisma.promptVersion.deleteMany).toHaveBeenCalled();
            expect(prisma.prompt.deleteMany).toHaveBeenCalled();
            expect(prisma.collection.deleteMany).toHaveBeenCalled();
            expect(prisma.tag.deleteMany).toHaveBeenCalled();
        });
    });

    describe('restoreLatestBackupService', () => {
        it('should throw if no backups found', async () => {
            (fs.readdir as any).mockResolvedValue([]);
            await expect(restoreLatestBackupService(userId, '/path')).rejects.toThrow("No backup files found");
        });

        it('should restore data from latest backup', async () => {
            // Mock file listing
            (fs.readdir as any).mockResolvedValue(['2023-01-01_prompthive_autobackup.json']);

            // Mock file content
            const backupData = {
                userId,
                collections: [{ id: 'c1', title: 'Col 1' }],
                prompts: [{
                    id: 'p1', title: 'P1',
                    versions: [{ versionNumber: 1, attachments: [] }],
                    tags: []
                }],
                tags: []
            };
            (fs.readFile as any).mockResolvedValue(JSON.stringify(backupData));

            // Mock IDs
            (prisma.collection.create as any).mockResolvedValue({ id: 'new-c1' });
            (prisma.prompt.create as any).mockResolvedValue({ id: 'new-p1', versions: [{ id: 'new-v1', versionNumber: 1 }] });

            await restoreLatestBackupService(userId, '/path');

            expect(prisma.collection.create).toHaveBeenCalled();
            expect(prisma.prompt.create).toHaveBeenCalled();
        });
    });
});
