import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as SettingsActions from './settings';
import * as WorkflowActions from './workflows';
import { getServerSession } from 'next-auth';
import * as SettingsService from '@/services/settings';
import * as WorkflowService from '@/services/workflows';

// Mocks
vi.mock('next-auth');
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
    redirect: vi.fn(() => { throw new Error('Redirect') })
}));
vi.mock('@/services/settings', () => ({
    updateVisibilitySettingsService: vi.fn(),
    updateGeneralSettingsService: vi.fn(),
    updateCollectionVisibilitySettingsService: vi.fn(),
}));
vi.mock('@/services/workflows', () => ({
    createWorkflow: vi.fn(),
    updateWorkflow: vi.fn(),
    deleteWorkflow: vi.fn(),
}));

describe('Simple Action Wrappers', () => {
    const userId = 'u-1';
    const mockSession = { user: { id: userId, role: 'USER' } };

    beforeEach(() => {
        vi.clearAllMocks();
        (getServerSession as any).mockResolvedValue(mockSession);
    });

    describe('Settings Actions', () => {
        it('saveVisibilitySettings should fail if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const res = await SettingsActions.saveVisibilitySettings({}, new FormData());
            expect(res.error).toBe('Unauthorized');
        });

        it('saveVisibilitySettings should call service', async () => {
            const fd = new FormData();
            fd.append('hiddenUserIds', JSON.stringify(['u-2']));
            const res = await SettingsActions.saveVisibilitySettings({}, fd);
            expect(res.success).toBeDefined();
            expect(SettingsService.updateVisibilitySettingsService).toHaveBeenCalledWith(userId, ['u-2']);
        });

        it('saveGeneralSettings should call service', async () => {
            const fd = new FormData();
            fd.append('showPrompterTips', 'on');
            const res = await SettingsActions.saveGeneralSettings({}, fd);
            expect(res.success).toBeDefined();
            expect(SettingsService.updateGeneralSettingsService).toHaveBeenCalledWith(userId, expect.objectContaining({ showPrompterTips: true }));
        });

        it('saveCollectionVisibilityAction should call service', async () => {
            await SettingsActions.saveCollectionVisibilityAction(['c-1']);
            expect(SettingsService.updateCollectionVisibilitySettingsService).toHaveBeenCalledWith(userId, ['c-1']);
        });
    });

    describe('Workflow Actions', () => {
        it('createWorkflowAction should call service and redirect', async () => {
            const fd = new FormData();
            fd.append('title', 'WF');
            (WorkflowService.createWorkflow as any).mockResolvedValue({ id: 'wf-1' });

            await expect(WorkflowActions.createWorkflowAction(fd)).rejects.toThrow(); // Redirect throws
            expect(WorkflowService.createWorkflow).toHaveBeenCalledWith(userId, 'WF', '', []);
        });

        it('updateWorkflowAction should call service', async () => {
            const fd = new FormData();
            fd.append('title', 'WF Upd');
            await WorkflowActions.updateWorkflowAction('wf-1', fd);
            expect(WorkflowService.updateWorkflow).toHaveBeenCalledWith(userId, 'wf-1', 'WF Upd', '', []);
        });

        it('deleteWorkflowAction should call service', async () => {
            await WorkflowActions.deleteWorkflowAction('wf-1');
            expect(WorkflowService.deleteWorkflow).toHaveBeenCalledWith(userId, 'wf-1');
        });
    });
});
