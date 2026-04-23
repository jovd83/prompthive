import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleLockService, toggleVisibilityService } from './prompt-visibility';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        prompt: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}));

describe('Prompt Visibility Service', () => {
    const userId = 'user-123';
    const promptId = 'prompt-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toggleLockService', () => {
        it('should throw if prompt not found', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue(null);
            await expect(toggleLockService(userId, promptId)).rejects.toThrow('Prompt not found');
        });

        it('should throw if user is not creator', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: 'other-user' });
            await expect(toggleLockService(userId, promptId)).rejects.toThrow('Only the creator can lock/unlock this prompt.');
        });

        it('should toggle lock status if user is creator', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: userId, isLocked: false });
            await toggleLockService(userId, promptId);
            expect(prisma.prompt.update).toHaveBeenCalledWith({
                where: { id: promptId },
                data: { isLocked: true }
            });
        });
    });

    describe('toggleVisibilityService', () => {
        it('should throw if prompt not found', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue(null);
            await expect(toggleVisibilityService(userId, promptId)).rejects.toThrow('Prompt not found');
        });

        it('should throw if user is not creator', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: 'other-user' });
            await expect(toggleVisibilityService(userId, promptId)).rejects.toThrow('Only the creator can change visibility.');
        });

        it('should toggle visibility status if user is creator', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: userId, isPrivate: false });
            await toggleVisibilityService(userId, promptId);
            expect(prisma.prompt.update).toHaveBeenCalledWith({
                where: { id: promptId },
                data: { isPrivate: true }
            });
        });
    });
});
