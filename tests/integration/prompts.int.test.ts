import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createPromptService } from '@/services/prompts';

// We explicitly do NOT mock Prisma here. This is a true integration test.
// We only mock dependencies that we don't want to hit real IO (like filesystem)
vi.mock('@/services/files', () => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
}));

describe('Prompts Service Integration', () => {
    let testUser: { id: string };

    beforeEach(async () => {
        // Warning: This cleanup wipes data! Ensure Vitest uses the test.db
        // To be safe, we only wipe what we touch, or rely on db logic.
        await prisma.prompt.deleteMany();
        
        const user = await prisma.user.findUnique({ where: { email: 'integration@test.com' } });
        if (user) {
            testUser = user;
        } else {
            testUser = await prisma.user.create({
                data: {
                    email: 'integration@test.com',
                    username: 'integration_test',
                    passwordHash: 'dummy'
                }
            });
        }
    });

    it('should create a prompt and a version cleanly in the actual SQLite database', async () => {
        const input = {
            title: 'Integration Test Prompt',
            description: 'Testing the Database without Playwright UI overhead',
            content: 'Write me an integration test in Vitest.',
            shortContent: '',
            usageExample: '',
            variableDefinitions: '[]',
            collectionId: '',
            tagIds: [],
            resultText: ''
        };

        const result = await createPromptService(testUser.id, input, [], []);

        expect(result).toBeDefined();
        
        // Assert directly against the Database state
        const dbPrompt = await prisma.prompt.findUnique({
            where: { id: result.id },
            include: { versions: true }
        });

        expect(dbPrompt).not.toBeNull();
        expect(dbPrompt?.title).toEqual('Integration Test Prompt');
        
        // Assert version tree integrity
        expect(dbPrompt?.versions.length).toBe(1);
        expect(dbPrompt?.versions[0].content).toEqual('Write me an integration test in Vitest.');
        
        // Assert the current head is correctly set
        expect(dbPrompt?.currentVersionId).toEqual(dbPrompt?.versions[0].id);
    });
});
