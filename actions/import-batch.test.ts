import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importStructureAction, importBatchAction } from './import-batch';
import { getServerSession } from 'next-auth';
import { importUnifiedService, importStructureService } from '@/services/imports';
import { revalidatePath } from 'next/cache';

// Mocks
vi.mock('next-auth');
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/services/imports', () => ({
    importStructureService: vi.fn(),
    importUnifiedService: vi.fn(),
}));

describe('Import Batch Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const mockSession = { user: { id: 'u-1' } };

    describe('importStructureAction', () => {
        it('should return error if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const result = await importStructureAction([]);
            expect(result).toEqual({ success: false, error: 'Unauthorized' });
        });

        it('should call service and return idMap', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (importStructureService as any).mockResolvedValue({ 'old-1': 'new-1' });

            const result = await importStructureAction([]);

            expect(importStructureService).toHaveBeenCalledWith('u-1', []);
            expect(revalidatePath).toHaveBeenCalled();
            expect(result).toEqual({ success: true, idMap: { 'old-1': 'new-1' } });
        });

        it('should catch service errors', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (importStructureService as any).mockRejectedValue(new Error('Fail'));

            const result = await importStructureAction([]);

            expect(result).toEqual({ success: false, error: 'Fail' });
        });
    });

    describe('importBatchAction', () => {
        it('should return error if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            const result = await importBatchAction([]);
            expect(result).toEqual({ success: false, error: 'Unauthorized' });
        });

        it('should call service and return count', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (importUnifiedService as any).mockResolvedValue({ count: 5, skipped: 1 });

            const result = await importBatchAction([], { 'old': 'new' });

            expect(importUnifiedService).toHaveBeenCalledWith('u-1', [], { 'old': 'new' });
            expect(revalidatePath).toHaveBeenCalled();
            expect(result).toEqual({ success: true, count: 5, skipped: 1 });
        });

        it('should catch and format service errors', async () => {
            (getServerSession as any).mockResolvedValue(mockSession);
            (importUnifiedService as any).mockRejectedValue(new Error('Batch Error'));

            const result = await importBatchAction([]);

            expect(result).toEqual({ success: false, error: 'Batch failed: Batch Error' });
        });
    });
});
