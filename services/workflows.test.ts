
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWorkflow, updateWorkflow, deleteWorkflow, getWorkflow, listWorkflows } from './workflows';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        workflow: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
        },
        workflowStep: {
            deleteMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    }
}));

describe('Workflows Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createWorkflow', () => {
        it('should create a workflow with steps', async () => {
            const steps = [
                { promptId: 'p1', order: 0, inputMappings: { var1: 'USER_INPUT' } }
            ];

            (prisma.workflow.create as any).mockResolvedValue({ id: 'wf-1' });

            await createWorkflow(userId, 'My Workflow', 'Desc', steps);

            expect(prisma.workflow.create).toHaveBeenCalledWith({
                data: {
                    ownerId: userId,
                    title: 'My Workflow',
                    description: 'Desc',
                    steps: {
                        create: [{
                            promptId: 'p1',
                            order: 0,
                            inputMappings: JSON.stringify({ var1: 'USER_INPUT' })
                        }]
                    }
                },
                include: { steps: true }
            });
        });
    });

    describe('updateWorkflow', () => {
        it('should update workflow title and replace steps', async () => {
            // Mock findUnique for auth check
            (prisma.workflow.findUnique as any).mockResolvedValue({ id: 'wf-1', ownerId: userId });

            const steps = [
                { promptId: 'p2', order: 0, inputMappings: {} }
            ];

            await updateWorkflow(userId, 'wf-1', 'New Title', 'New Desc', steps);

            // Check updates
            expect(prisma.workflow.update).toHaveBeenCalledWith({
                where: { id: 'wf-1' },
                data: { title: 'New Title', description: 'New Desc' }
            });

            // Check step replacement
            expect(prisma.workflowStep.deleteMany).toHaveBeenCalledWith({ where: { workflowId: 'wf-1' } });
            expect(prisma.workflowStep.create).toHaveBeenCalled();
        });

        it('should throw if unauthorized', async () => {
            (prisma.workflow.findUnique as any).mockResolvedValue({ id: 'wf-1', ownerId: 'other' });
            await expect(updateWorkflow(userId, 'wf-1', 'T', 'D', [])).rejects.toThrow();
        });
    });

    describe('getWorkflow', () => {
        it('should fetch workflow with nested prompt versions', async () => {
            (prisma.workflow.findUnique as any).mockResolvedValue({ id: 'wf-1', ownerId: userId });

            await getWorkflow(userId, 'wf-1');

            expect(prisma.workflow.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                include: {
                    steps: {
                        include: {
                            prompt: {
                                include: {
                                    versions: {
                                        orderBy: { versionNumber: 'desc' },
                                        take: 1
                                    }
                                }
                            }
                        },
                        orderBy: { order: 'asc' }
                    }
                }
            }));
        });
    });

    describe('deleteWorkflow', () => {
        it('should delete if owner', async () => {
            (prisma.workflow.findUnique as any).mockResolvedValue({ id: 'wf-1', ownerId: userId });
            await deleteWorkflow(userId, 'wf-1');
            expect(prisma.workflow.delete).toHaveBeenCalledWith({ where: { id: 'wf-1' } });
        });
    });

    describe('listWorkflows', () => {
        it('should list workflows for user', async () => {
            await listWorkflows(userId);
            expect(prisma.workflow.findMany).toHaveBeenCalledWith({
                where: { ownerId: userId },
                orderBy: { updatedAt: 'desc' },
                include: { _count: { select: { steps: true } } }
            });
        });
    });
});
