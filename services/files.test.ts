import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile, deleteFile } from './files';
import { validateFileExtension } from './utils';
import fs from 'fs/promises';
import path from 'path';

// Mock validateFileExtension
vi.mock('./utils', () => ({
    validateFileExtension: vi.fn(),
}));

// Mock FS
vi.mock('fs/promises', () => ({
    default: {
        mkdir: vi.fn(),
        writeFile: vi.fn(),
        unlink: vi.fn(),
    }
}));

// Mock sharp
vi.mock('sharp', () => ({
    default: vi.fn().mockReturnValue({
        resize: vi.fn().mockReturnThis(),
        toFile: vi.fn().mockResolvedValue({}),
    })
}));

describe('Files Service', () => {
    // Mock File object
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('should validate extension', async () => {
            await uploadFile(mockFile);
            expect(validateFileExtension).toHaveBeenCalledWith('test.txt');
        });

        it('should create upload dir', async () => {
            await uploadFile(mockFile);
            expect(fs.mkdir).toHaveBeenCalled();
        });

        it('should write file to disk', async () => {
            const result = await uploadFile(mockFile, 'prefix-');

            expect(fs.writeFile).toHaveBeenCalled();
            expect(result.filePath).toContain('prefix-');
            expect(result.filePath).toContain('test.txt');
            expect(result.fileType).toBe('text/plain');
        });

        it('should generate thumbnail for images', async () => {
            const { default: sharp } = await import('sharp');
            const mockImage = new File(['img'], 'test.jpg', { type: 'image/jpeg' });
            mockImage.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

            await uploadFile(mockImage);

            expect(sharp).toHaveBeenCalled();
        });
    });

    describe('deleteFile', () => {
        it('should unlink file', async () => {
            await deleteFile('/uploads/test.txt');
            expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('test.txt'));
        });

        it('should ignore error if unlink fails', async () => {
            (fs.unlink as any).mockRejectedValue(new Error('File not found'));

            await expect(deleteFile('/uploads/test.txt')).resolves.not.toThrow();
        });
    });
});
