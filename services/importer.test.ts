
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importLocalFolder } from './importer';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('fs', () => {
    return {
        default: {
            existsSync: vi.fn(),
            promises: {
                mkdir: vi.fn(),
                copyFile: vi.fn(),
                readdir: vi.fn(),
                readFile: vi.fn(),
            }
        }
    };
});

vi.mock('@/lib/prisma', () => ({
    prisma: {
        collection: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        prompt: {
            create: vi.fn(),
            update: vi.fn(),
        },
        promptVersion: {
            create: vi.fn(),
        },
        attachment: {
            create: vi.fn(),
        }
    }
}));

vi.mock('./id-service', () => ({
    generateTechnicalId: vi.fn().mockResolvedValue('mock-technical-id'),
}));

describe('importLocalFolder', () => {
    const userId = "user-123";
    const rootPath = "/tmp/root_import";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error if root path does not exist', async () => {
        (fs.existsSync as any).mockReturnValue(false);

        await expect(importLocalFolder(rootPath, userId)).rejects.toThrow(`Path does not exist: ${rootPath}`);
    });

    it('should create root collection if it does not exist', async () => {
        (fs.existsSync as any).mockReturnValue(true);
        // Root dir empty
        (fs.promises.readdir as any).mockResolvedValue([]);

        // Collection not found
        (prisma.collection.findFirst as any).mockResolvedValue(null);
        (prisma.collection.create as any).mockResolvedValue({ id: 'root-col-id', title: 'root_import' });

        const count = await importLocalFolder(rootPath, userId);

        expect(prisma.collection.create).toHaveBeenCalledWith({
            data: {
                title: 'root_import',
                ownerId: userId,
                parentId: null
            }
        });
        expect(count).toBe(0);
    });

    it('should process a sub-directory as a prompt if it contains text files', async () => {
        (fs.existsSync as any).mockReturnValue(true);

        // Root contains "MyPrompt" dir
        (fs.promises.readdir as any)
            .mockResolvedValueOnce([ // Root dir
                { name: 'MyPrompt', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([ // MyPrompt dir
                { name: 'prompt.txt', isDirectory: () => false, isFile: () => true }
            ]);

        (fs.promises.readFile as any).mockResolvedValue("Prompt Content");

        (prisma.collection.findFirst as any).mockResolvedValue({ id: 'root-col-id' });

        (prisma.prompt.create as any).mockResolvedValue({ id: 'prompt-id' });
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'version-id' });
        (prisma.prompt.update as any).mockResolvedValue({});

        const count = await importLocalFolder(rootPath, userId);

        expect(count).toBe(1);
        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                title: 'MyPrompt',
                collections: { connect: { id: 'root-col-id' } }
            })
        }));
        expect(prisma.promptVersion.create).toHaveBeenCalled();
    });

    it('should process a sub-directory as a sub-collection if it has no text files', async () => {
        (fs.existsSync as any).mockReturnValue(true);

        // Root contains "SubCol" dir
        (fs.promises.readdir as any)
            .mockResolvedValueOnce([ // Root dir
                { name: 'SubCol', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([ // SubCol dir - empty or only dirs
                { name: 'NestedPrompt', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([ // NestedPrompt dir
                { name: 'p.md', isDirectory: () => false, isFile: () => true }
            ]);

        (fs.promises.readFile as any).mockResolvedValue("Nested Content");

        // Mocks for collections
        (prisma.collection.findFirst as any)
            .mockResolvedValueOnce({ id: 'root-col-id' }) // Root
            .mockResolvedValueOnce(null); // SubCol not found

        (prisma.collection.create as any).mockResolvedValue({ id: 'sub-col-id', title: 'SubCol' });

        // Mocks for Prompt
        (prisma.prompt.create as any).mockResolvedValue({ id: 'p-id' });
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-id' });

        const count = await importLocalFolder(rootPath, userId);

        expect(count).toBe(1);
        // Verify SubCol created linked to Root
        expect(prisma.collection.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                title: 'SubCol',
                parentId: 'root-col-id'
            })
        }));

        // Verify Prompt created linked to SubCol
        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                title: 'NestedPrompt',
                collections: { connect: { id: 'sub-col-id' } }
            })
        }));
    });

    it('should handle attachments (images) in prompt folder', async () => {
        (fs.existsSync as any).mockReturnValue(true);
        (fs.promises.mkdir as any).mockResolvedValue(undefined);
        (fs.promises.copyFile as any).mockResolvedValue(undefined);

        // Root contains "PromptWithImg"
        (fs.promises.readdir as any)
            .mockResolvedValueOnce([
                { name: 'PromptWithImg', isDirectory: () => true, isFile: () => false }
            ])
            .mockResolvedValueOnce([
                { name: 'prompt.txt', isDirectory: () => false, isFile: () => true },
                { name: 'image.png', isDirectory: () => false, isFile: () => true }
            ]);

        (fs.promises.readFile as any).mockResolvedValue("Content");
        (prisma.collection.findFirst as any).mockResolvedValue({ id: 'root-col-id' });
        (prisma.prompt.create as any).mockResolvedValue({ id: 'p-id' });
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-id' });

        await importLocalFolder(rootPath, userId);

        // Verify copy
        expect(fs.promises.copyFile).toHaveBeenCalled();
        // Verify Attachment creation
        expect(prisma.attachment.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                versionId: 'v-id',
                fileType: 'image/png',
                originalName: 'image.png'
            })
        }));
    });
});
