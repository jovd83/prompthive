
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importPromptsService } from './imports';
import { prisma } from '@/lib/prisma';

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

describe('Bug Reproduction: Flat Import Fields', () => {
    const userId = 'u-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (prisma.tag.findMany as any).mockResolvedValue([]);
        (prisma.collection.findMany as any).mockResolvedValue([]);
    });

    it('should correctly map variableDefinitions, resultText, and usageExample from flat import (V1)', async () => {
        const data = [{
            title: 'Bug Repro',
            content: 'Hello {{name}}',
            variableDefinitions: '["{{name}}"]', // Valid JSON string which the app SHOULD accept
            usageExample: 'My usage example',
            resultText: 'My result text',
            description: 'My description'
        }];

        (prisma.prompt.findFirst as any).mockResolvedValue(null);
        (prisma.prompt.create as any).mockResolvedValue({ id: 'p-1', versions: [{ id: 'v-1', versionNumber: 1 }] });

        await importPromptsService(userId, data);

        // Expect prisma.prompt.create to be called with the mapped fields
        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                versions: {
                    create: expect.arrayContaining([
                        expect.objectContaining({
                            variableDefinitions: '["{{name}}"]',
                            usageExample: 'My usage example',
                            resultText: 'My result text',
                            content: 'Hello {{name}}'
                        })
                    ])
                }
            })
        }));
    });
});
