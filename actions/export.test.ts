import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getExportMeta, getExportBatch } from './export';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Mocks
vi.mock('next-auth');
vi.mock('@/lib/prisma', () => ({
    prisma: {
        collection: { findMany: vi.fn() },
        prompt: { findMany: vi.fn() },
    }
}));

// Mock FS
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
    }
}));

describe('Export Actions', () => {
    const userId = 'u-1';
    const mockSession = { user: { id: userId } };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getExportMeta', () => {
        it('should return error if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const result = await getExportMeta();
            expect(result).toEqual({ success: false, error: 'Unauthorized' });
        });

        it('should fetch prompts and basic collections (simple)', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);

            // Mock Prompts
            (prisma.prompt.findMany as any).mockResolvedValue([
                { id: 'p-1', collections: [{ id: 'c-1' }] }
            ]);

            // Mock All User Collections (for hierarchy resolution)
            (prisma.collection.findMany as any).mockResolvedValue([
                { id: 'c-1', title: 'C1', parentId: null },
                { id: 'c-2', title: 'C2', parentId: null }
            ]);

            const result = await getExportMeta();

            expect(result.success).toBe(true);
            expect(result.totalPrompts).toBe(1);
            expect(result.definedCollections).toHaveLength(1);
            expect(result.definedCollections?.[0].id).toBe('c-1');
        });

        it('should resolve ancestors', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);

            // P1 is in C3. C3 -> C2 -> C1
            (prisma.prompt.findMany as any).mockResolvedValue([
                { id: 'p-1', collections: [{ id: 'c-3' }] }
            ]);

            (prisma.collection.findMany as any).mockResolvedValue([
                { id: 'c-1', title: 'Root', parentId: null },
                { id: 'c-2', title: 'Middle', parentId: 'c-1' },
                { id: 'c-3', title: 'Child', parentId: 'c-2' },
            ]);

            const result = await getExportMeta();

            // Should include C3, C2, and C1
            expect(result.definedCollections).toHaveLength(3);
            const ids = result.definedCollections?.map((c: any) => c.id).sort();
            expect(ids).toEqual(['c-1', 'c-2', 'c-3']);
        });

        it('should handle recursive hierarchy for requested collection IDs', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);

            // User asks for Root (c-1), recursive=true
            // C1 -> C2
            (prisma.collection.findMany as any).mockResolvedValue([
                { id: 'c-1', parentId: null },
                { id: 'c-2', parentId: 'c-1' }
            ]);

            // Prompts in those
            (prisma.prompt.findMany as any).mockResolvedValue([
                { id: 'p-A', collections: [{ id: 'c-2' }] }
            ]);

            const result = await getExportMeta(['c-1'], true);

            // Recursion Logic Test:
            // 1. getDescendantCollectionIds(['c-1']) -> {c-1, c-2}
            // 2. prompt query should use IN ['c-1', 'c-2']
            expect(prisma.prompt.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    collections: { some: { id: { in: expect.arrayContaining(['c-1', 'c-2']) } } }
                })
            }));
            expect(result.definedCollections).toHaveLength(2);
        });
    });

    describe('getExportBatch', () => {
        it('should return error if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const result = await getExportBatch([]);
            expect(result).toEqual({ success: false, error: 'Unauthorized' });
        });

        it('should format export data and encode files', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);

            const mockDate = new Date();
            (prisma.prompt.findMany as any).mockResolvedValue([
                {
                    id: 'p-1',
                    title: 'Title',
                    tags: [{ name: 'tag1' }],
                    collections: [{ id: 'c-1', title: 'Col' }],
                    versions: [{
                        versionNumber: 1,
                        attachments: [{ filePath: '/foo.txt', fileType: 'text/plain' }],
                        resultImage: '/img.png',
                        createdAt: mockDate
                    }],
                    createdAt: mockDate,
                    updatedAt: mockDate
                }
            ]);

            // Mock FS for files
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readFileSync as any).mockReturnValue(Buffer.from('mock-content'));

            const result = await getExportBatch(['p-1']);

            expect(result.success).toBe(true);
            const p = result.prompts?.[0];
            expect(p?.title).toBe('Title');
            expect(p?.tags).toEqual(['tag1']);
            expect(p?.versions[0].attachments[0].file).toEqual({
                data: Buffer.from('mock-content').toString('base64'),
                type: 'text/plain'
            });
            expect(p?.versions[0].resultImage?.file).toEqual({
                data: Buffer.from('mock-content').toString('base64'),
                type: 'image/png' // inferred from ext
            });
        });

        it('should handle missing files gracefully', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (prisma.prompt.findMany as any).mockResolvedValue([
                {
                    id: 'p-1',
                    tags: [],
                    collections: [],
                    versions: [{
                        attachments: [{ filePath: '/missing.txt' }],
                        resultImage: null
                    }]
                }
            ]);

            (fs.existsSync as any).mockReturnValue(false);

            const result = await getExportBatch(['p-1']);
            const att = result.prompts?.[0].versions[0].attachments[0];
            expect(att?.file).toBeNull();
        });
    });
});
