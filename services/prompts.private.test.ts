
import { createPromptService } from './prompts';
import { prisma } from '@/lib/prisma'; // This will be the mocked version
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 2. Do the mock
vi.mock('@/lib/prisma', () => {
    const mockPrisma = {
        prompt: {
            create: vi.fn(),
            update: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        collection: {
            findUnique: vi.fn(),
        },
        technicalIdSequence: {
            upsert: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback({
            prompt: {
                create: vi.fn(),
                update: vi.fn(),
            }
        })),
    };
    return { prisma: mockPrisma };
});

// Mock files
vi.mock('@/lib/files', () => ({
    uploadFile: vi.fn().mockResolvedValue({ filePath: '/mock/path', fileType: 'image/png' }),
    deleteFile: vi.fn(),
}));

describe('Private Prompts Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default behaviors
        (prisma.prompt.findFirst as any).mockResolvedValue(null);
        (prisma.collection.findUnique as any).mockResolvedValue({ title: "Test Col" });
        (prisma.technicalIdSequence.upsert as any).mockResolvedValue({ prefix: "TEST", lastValue: 1 });

        // Ensure create returns a valid object
        (prisma.prompt.create as any).mockResolvedValue({
            id: "prompt-1",
            versions: [{ id: "v1" }]
        });
        (prisma.prompt.update as any).mockResolvedValue({});
    });

    it('should create a private prompt when isPrivate is true', async () => {
        const input = {
            title: "Secret Prompt",
            description: "Shhh",
            content: "secret content",
            shortContent: "",
            usageExample: "",
            variableDefinitions: "[]",
            collectionId: "col-1",
            tagIds: [],
            resultText: "",
            isPrivate: true
        };

        await createPromptService("user-1", input, [], []);

        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                title: "Secret Prompt",
                isPrivate: true,
                createdById: "user-1"
            })
        }));
    });

    it('should default isPrivate to false if not provided', async () => {
        const input = {
            title: "Public Prompt",
            description: "Hello",
            content: "content",
            shortContent: "",
            usageExample: "",
            variableDefinitions: "[]",
            collectionId: "col-1",
            tagIds: [],
            resultText: "",
        };

        await createPromptService("user-1", input, [], []);

        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                isPrivate: false
            })
        }));
    });
});
