import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importStructureService, importPromptsService, importUnifiedService } from './imports';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

// Mocks
vi.mock('@/lib/prisma', () => ({
    prisma: {
        tag: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
        collection: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), findUnique: vi.fn() },
        prompt: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    }
}));

vi.mock('fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
    }
}));

vi.mock('./id-service', () => ({
    generateTechnicalId: vi.fn((name) => Promise.resolve(name.toLowerCase().replace(/\s+/g, '-'))),
}));

vi.mock('@/lib/color-utils', () => ({
    generateColorFromName: vi.fn(() => '#000000'),
}));

vi.mock('@/lib/import-utils', () => ({
    detectFormat: vi.fn(() => 'STANDARD'),
}));

describe('Imports Service', () => {
    const userId = 'u-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('importStructureService', () => {
        it('should create root and child collections recursively', async () => {
            const structure = [
                { id: '1', title: 'Root', parentId: null },
                { id: '2', title: 'Child', parentId: '1' }
            ];

            // Upsert mocks
            (prisma.collection.upsert as any)
                .mockResolvedValueOnce({ id: 'db-1', title: 'Root' })
                .mockResolvedValueOnce({ id: 'db-2', title: 'Child' });

            const idMap = await importStructureService(userId, structure);

            // Expect map
            expect(idMap).toEqual({ '1': 'db-1', '2': 'db-2' });

            // Check calls
            expect(prisma.collection.upsert).toHaveBeenCalledTimes(2);
            // First call (Root)
            expect(prisma.collection.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
                create: expect.objectContaining({ title: 'Root', parentId: null })
            }));
            // Second call (Child) should use db-1 as parent
            expect(prisma.collection.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
                create: expect.objectContaining({ title: 'Child', parentId: 'db-1' })
            }));
        });
    });

    describe('importPromptsService', () => {
        beforeEach(() => {
            // Setup default mocks for batching helpers
            (prisma.tag.findMany as any).mockResolvedValue([]);
            (prisma.collection.findMany as any).mockResolvedValue([]);
        });

        it('should create new tags and collections if missing', async () => {
            const data = [{
                title: 'P1',
                tags: ['TagA'],
                collections: ['ColA'],
                versions: [{ content: 'foo' }]
            }];

            (prisma.tag.create as any).mockResolvedValue({ id: 't-new', name: 'TagA' });
            (prisma.collection.create as any).mockResolvedValue({ id: 'c-new', title: 'ColA' });
            (prisma.prompt.findFirst as any).mockResolvedValue(null); // Not existing
            (prisma.prompt.create as any).mockResolvedValue({ id: 'p-1', versions: [{ id: 'v-1', versionNumber: 1 }] });

            await importPromptsService(userId, data);

            expect(prisma.tag.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'TagA' }) }));
            expect(prisma.collection.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'ColA' }) }));

            // Check connect
            expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    tags: { connect: [{ id: 't-new' }] },
                    collections: { connect: [{ id: 'c-new' }] }
                })
            }));
        });

        it('should skip existing prompts by title', async () => {
            const data = [{ title: 'P1', versions: [{ content: 'foo' }] }];
            (prisma.prompt.findFirst as any).mockResolvedValue({ id: 'p-existing' });

            const res = await importPromptsService(userId, data);
            expect(res.skipped).toBe(1);
            expect(prisma.prompt.create).not.toHaveBeenCalled();
        });

        it('should handle V2 ID mapping', async () => {
            const data = [{
                title: 'P1',
                collectionIds: ['old-c1'], // Map this
                versions: [{ content: 'foo' }]
            }];
            const idMap = { 'old-c1': 'db-c1' };

            (prisma.prompt.findFirst as any).mockResolvedValue(null);
            (prisma.prompt.create as any).mockResolvedValue({ id: 'p-1', versions: [] });

            await importPromptsService(userId, data, idMap);

            expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    collections: { connect: [{ id: 'db-c1' }] }
                })
            }));
        });

        it('should restore images from base64', async () => {
            const data = [{
                title: 'P1',
                versions: [{
                    content: 'v1',
                    resultImage: { path: 'img.png', file: { data: 'base64data' } }
                }]
            }];

            (prisma.prompt.findFirst as any).mockResolvedValue(null);
            (prisma.prompt.create as any).mockResolvedValue({ id: 'p-1', versions: [] });

            await importPromptsService(userId, data);

            expect(fs.writeFile).toHaveBeenCalled(); // Should write restored image
            expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    versions: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ resultImage: expect.stringContaining('/uploads/restored-') })
                        ])
                    }
                })
            }));
        });
    });

    describe('importUnifiedService', () => {
        it('should validate and dispatch', async () => {
            // Valid data
            const data = { prompts: [{ title: 'Test', versions: [{ content: 'c' }] }] };

            // Mock internal service call if we wanted, but we imported it from same file so spy is hard without re-import or logic separation.
            // We just test the flow through to prisma since we mocked prisma.
            (prisma.prompt.findFirst as any).mockResolvedValue(null);
            (prisma.prompt.create as any).mockResolvedValue({ id: 'p-1', versions: [] });

            await importUnifiedService(userId, data);

            expect(prisma.prompt.create).toHaveBeenCalled();
        });

        it('should throw on invalid schema', async () => {
            const data = null; // Definitely invalid
            await expect(importUnifiedService(userId, data)).rejects.toThrow('Invalid import data format');
        });
    });
});
