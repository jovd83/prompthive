import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as PromptsActions from './prompts';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as PromptsService from '@/services/prompts';

// Mocks
vi.mock('next-auth');
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() },
        prompt: { findUnique: vi.fn() }
    }
}));
vi.mock('@/services/prompts', () => ({
    createTagService: vi.fn(),
    createPromptService: vi.fn(),
    createVersionService: vi.fn(),
    restoreVersionService: vi.fn(),
    deletePromptService: vi.fn(),
    deleteUnusedTagsService: vi.fn(),
    cleanupPromptAssetsService: vi.fn(),
    movePromptService: vi.fn(),
    bulkMovePromptsService: vi.fn(),
    bulkAddTagsService: vi.fn(),
    toggleLockService: vi.fn(),
    linkPromptsService: vi.fn(),
    unlinkPromptsService: vi.fn(),
    searchPromptsForLinkingService: vi.fn(),
}));

describe('Prompts Actions', () => {
    const userId = 'u-1';
    const mockSession = { user: { id: userId, role: 'USER' } };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as any).mockResolvedValue(mockSession);
        (prisma.user.findUnique as any).mockResolvedValue({ id: userId });
    });

    describe('createTag', () => {
        it('should call service', async () => {
            (PromptsService.createTagService as any).mockResolvedValue({ id: 't-1' });
            await PromptsActions.createTag('new-tag');
            expect(PromptsService.createTagService).toHaveBeenCalledWith('new-tag');
        });
    });

    describe('createPrompt', () => {
        it('should validate and call service', async () => {
            const fd = new FormData();
            fd.append('title', 'Title');
            fd.append('content', 'Content');

            (PromptsService.createPromptService as any).mockResolvedValue({ id: 'p-1' });

            await PromptsActions.createPrompt(fd);

            expect(PromptsService.createPromptService).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({ title: 'Title', content: 'Content' }),
                [],
                []
            );
        });

        it('should throw on validation error', async () => {
            const fd = new FormData();
            // Missing content
            await expect(PromptsActions.createPrompt(fd)).rejects.toThrow();
        });
    });

    describe('createVersion', () => {
        it('should validate and call service', async () => {
            const fd = new FormData();
            fd.append('promptId', 'p-1');
            fd.append('content', 'New Ver');

            await PromptsActions.createVersion(fd);

            expect(PromptsService.createVersionService).toHaveBeenCalledWith(
                userId,
                expect.objectContaining({ promptId: 'p-1', content: 'New Ver' }),
                [],
                []
            );
        });
    });

    describe('Simple Wrappers', () => {
        it('deletePrompt', async () => {
            await PromptsActions.deletePrompt('p-1');
            expect(PromptsService.deletePromptService).toHaveBeenCalledWith(userId, 'p-1');
        });

        it('toggleLock', async () => {
            await PromptsActions.toggleLock('p-1');
            expect(PromptsService.toggleLockService).toHaveBeenCalledWith(userId, 'p-1');
        });

        it('linkPrompts', async () => {
            await PromptsActions.linkPrompts('p-1', 'p-2');
            expect(PromptsService.linkPromptsService).toHaveBeenCalledWith(userId, 'p-1', 'p-2');
        });

        it('restorePromptVersion', async () => {
            await PromptsActions.restorePromptVersion('p-1', 'v-1');
            expect(PromptsService.restoreVersionService).toHaveBeenCalledWith(userId, 'p-1', 'v-1');
        });

        it('deleteUnusedTags', async () => {
            await PromptsActions.deleteUnusedTags();
            expect(PromptsService.deleteUnusedTagsService).toHaveBeenCalled();
        });

        it('cleanupPromptAssets', async () => {
            await PromptsActions.cleanupPromptAssets('p-1');
            expect(PromptsService.cleanupPromptAssetsService).toHaveBeenCalledWith('p-1');
        });

        it('movePrompt', async () => {
            await PromptsActions.movePrompt('p-1', 'c-1');
            expect(PromptsService.movePromptService).toHaveBeenCalledWith(userId, 'p-1', 'c-1');
        });

        it('bulkMovePrompts', async () => {
            await PromptsActions.bulkMovePrompts(['p-1'], 'c-1');
            expect(PromptsService.bulkMovePromptsService).toHaveBeenCalledWith(userId, ['p-1'], 'c-1');
        });

        it('bulkAddTags', async () => {
            await PromptsActions.bulkAddTags(['p-1'], ['t-1']);
            expect(PromptsService.bulkAddTagsService).toHaveBeenCalledWith(userId, ['p-1'], ['t-1']);
        });

        it('unlinkPrompts', async () => {
            await PromptsActions.unlinkPrompts('p-1', 'p-2');
            expect(PromptsService.unlinkPromptsService).toHaveBeenCalledWith(userId, 'p-1', 'p-2');
        });

        it('searchCandidatePrompts', async () => {
            await PromptsActions.searchCandidatePrompts('q', 'ex');
            expect(PromptsService.searchPromptsForLinkingService).toHaveBeenCalledWith(userId, 'q', 'ex');
        });
    });
});
