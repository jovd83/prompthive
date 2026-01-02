
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPromptService, deletePromptService, createVersionService, deleteUnusedTagsService } from './prompts';
import { prisma } from '@/lib/prisma';

// Mock File Service
vi.mock('./files', () => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        prompt: {
            create: vi.fn(),
            update: vi.fn(),
            findUnique: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
            findFirst: vi.fn(),
        },
        promptVersion: {
            create: vi.fn(),
            findUnique: vi.fn(),
        },
        tag: {
            delete: vi.fn(),
            deleteMany: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
        },
        attachment: {
            findMany: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        }
    }
}));

describe('Prompts Service', () => {
    const userId = 'user-123';

    // Mock File object for attachments
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    mockFile.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createPromptService', () => {
        it('should create prompt with version and attachments', async () => {
            const input = {
                title: 'Test Prompt',
                description: 'Desc',
                content: 'Prompt content',
                shortContent: '',
                usageExample: '',
                variableDefinitions: '[]',
                collectionId: '',
                tagIds: [],
                resultText: ''
            };

            // Mock uploadFile result
            const { uploadFile } = await import('./files');
            (uploadFile as any).mockResolvedValue({
                filePath: '/uploads/test.txt',
                fileType: 'text/plain'
            });

            const mockPrompt = { id: 'p-1', versions: [{ id: 'v-1' }] };
            (prisma.prompt.create as any).mockResolvedValue(mockPrompt);

            await createPromptService(userId, input, [mockFile], []);

            // Check File Service via import
            expect(uploadFile).toHaveBeenCalled();

            // Check Prisma
            expect(prisma.prompt.create).toHaveBeenCalled();
            expect(prisma.prompt.update).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                data: { currentVersionId: 'v-1' }
            });
        });
    });

    describe('createVersionService', () => {
        it('should create new version and increment number', async () => {
            const input = {
                promptId: 'p-1',
                title: 'Test',
                content: 'New content',
                shortContent: '',
                usageExample: '',
                variableDefinitions: '',
                changelog: 'Fix',
                resultText: '',
                collectionId: '',
                keepAttachmentIds: [],
                keepResultImageIds: [],
                existingResultImagePath: ''
            };

            (prisma.prompt.findUnique as any).mockResolvedValue({
                id: 'p-1',
                versions: [{ versionNumber: 1 }]
            });

            (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-2' });

            await createVersionService(userId, input, [], []);

            expect(prisma.promptVersion.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    versionNumber: 2
                })
            }));
        });
    });

    describe('deletePromptService', () => {
        it('should delete prompt and cleanup assets', async () => {
            // First call: Prompt Lookup
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                createdById: userId,
                versions: []
            });

            // User lookup
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            // Second call: Internal cleanupPromptAssetsService (prompt lookup)
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                versions: []
            });

            // Third call: Get tags validation
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                createdById: userId,
                tags: []
            });

            await deletePromptService(userId, 'p-1');

            expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
        });

        it('should throw if access denied', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValue({
                id: 'p-1',
                createdById: 'other-user'
            });

            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, role: 'USER' });

            await expect(deletePromptService(userId, 'p-1')).rejects.toThrow("Access denied");
        });

        it('should allow ADMIN to delete other users prompt', async () => {
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                createdById: 'other-user',
                versions: [] // for cleanup
            });

            (prisma.user.findUnique as any).mockResolvedValue({ id: 'admin-id', role: 'ADMIN' });

            // Internal cleanup lookup
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                versions: []
            });
            // Tags lookup
            (prisma.prompt.findUnique as any).mockResolvedValueOnce({
                id: 'p-1',
                tags: []
            });

            await deletePromptService('admin-id', 'p-1');
            expect(prisma.prompt.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
        });
    });

    describe('deleteUnusedTagsService', () => {
        it('should delete tags with no prompts', async () => {
            const { deleteUnusedTagsService } = await import('./prompts');

            (prisma.tag.findMany as any).mockResolvedValue([{ id: 'tag-1' }]);

            await deleteUnusedTagsService();

            expect(prisma.tag.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: ['tag-1'] } }
            });
        });
    });

    it('should handle kept attachments and result images', async () => {
        const input = {
            promptId: 'p-1',
            title: 'Test',
            content: 'Content',
            shortContent: '',
            usageExample: '',
            variableDefinitions: '',
            changelog: 'Fix',
            resultText: '',
            collectionId: '',
            keepAttachmentIds: ['att-1'],
            keepResultImageIds: [],
            existingResultImagePath: ''
        };

        // Mock prompt
        (prisma.prompt.findUnique as any).mockResolvedValue({
            id: 'p-1',
            versions: [{ versionNumber: 1 }]
        });

        // Mock existing attachments lookup
        (prisma.attachment.findMany as any).mockResolvedValue([
            { id: 'att-1', filePath: '/old.txt', fileType: 'text/plain' }
        ]);

        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-2' });

        await createVersionService(userId, input, [], []);

        // Verify prisma create call includes the kept attachment
        expect(prisma.promptVersion.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                attachments: {
                    create: expect.arrayContaining([
                        expect.objectContaining({ filePath: '/old.txt' })
                    ])
                }
            })
        }));
    });

    it('should throw error if prompt not found in createVersion', async () => {
        (prisma.prompt.findUnique as any).mockResolvedValue(null);
        const input = { promptId: 'bad-id' } as any;
        await expect(createVersionService(userId, input, [], [])).rejects.toThrow('Prompt not found');
    });

    it('should handle new result images and legacy path in createVersion', async () => {
        const input = {
            promptId: 'p-1',
            title: 'Test',
            content: '',
            shortContent: '',
            usageExample: '',
            variableDefinitions: '',
            changelog: '',
            resultText: '',
            collectionId: 'new-col',
            keepAttachmentIds: [],
            keepResultImageIds: [],
            existingResultImagePath: '/legacy.jpg'
        };

        (prisma.prompt.findUnique as any).mockResolvedValue({ id: 'p-1', versions: [{ versionNumber: 1 }] });
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-2' });

        const { uploadFile } = await import('./files');
        (uploadFile as any).mockResolvedValue({ filePath: '/new.png', fileType: 'image/png' });

        await createVersionService(userId, input, [], [mockFile]);

        // Expect upload for result image
        expect(uploadFile).toHaveBeenCalled();
        // Expect update collection
        expect(prisma.prompt.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                collections: { set: [{ id: 'new-col' }] }
            })
        }));
    });

    it('should handle unassigning collection in createVersion', async () => {
        const input = {
            promptId: 'p-1',
            collectionId: 'unassigned',
            keepAttachmentIds: [],
            keepResultImageIds: []
        } as any;
        (prisma.prompt.findUnique as any).mockResolvedValue({ id: 'p-1', versions: [] });
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-2' });

        await createVersionService(userId, input, [], []);

        expect(prisma.prompt.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                collections: { set: [] }
            })
        }));
    });
});

describe('cleanupPromptAssetsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delete files for attachments and result images', async () => {
        const { deleteFile } = await import('./files');

        // Mock prompt with assets
        (prisma.prompt.findUnique as any).mockResolvedValue({
            id: 'p-1',
            versions: [
                {
                    resultImage: '/result.jpg', // Not in attachments, should be deleted explicitly
                    attachments: [
                        { filePath: '/att.txt' },
                        { filePath: '/shared.jpg' } // If this matched resultImage, special logic applies, but here prompt.resultImage is different
                    ]
                }
            ]
        });

        const { cleanupPromptAssetsService } = await import('./prompts');
        await cleanupPromptAssetsService('p-1');

        expect(deleteFile).toHaveBeenCalledWith('/att.txt');
        expect(deleteFile).toHaveBeenCalledWith('/shared.jpg');
        expect(deleteFile).toHaveBeenCalledWith('/result.jpg');
    });

    it('should not delete result image if it is also an attachment', async () => {
        const { deleteFile } = await import('./files');
        const { cleanupPromptAssetsService } = await import('./prompts');

        (prisma.prompt.findUnique as any).mockResolvedValue({
            id: 'p-1',
            versions: [
                {
                    resultImage: '/shared.jpg',
                    attachments: [
                        { filePath: '/shared.jpg' }
                    ]
                }
            ]
        });

        await cleanupPromptAssetsService('p-1');
        // It deletes attachments looped, so it deletes /shared.jpg once.
        // Then checks resultImage. It IS attached, so it should NOT delete again (duplicate check logic).

        // We verify called once
        expect(deleteFile).toHaveBeenCalledWith('/shared.jpg');
        expect(deleteFile).toHaveBeenCalledTimes(1);
    });
});

describe('getAllPromptsSimple', () => {
    it('should fetch and map prompts', async () => {
        const { getAllPromptsSimple } = await import('./prompts');
        const mockData = [
            { id: '1', title: 'A', versions: [{ variableDefinitions: 'vars' }] }
        ];
        (prisma.prompt.findMany as any).mockResolvedValue(mockData);

        const result = await getAllPromptsSimple('u-1');
        expect(result).toEqual([{ id: '1', title: 'A', variableDefinitions: 'vars' }]);
    });
});

describe('Full Integration Test for CreatePrompt', () => {
    it('should handle optional fields like tags, images, collections', async () => {
        const input = {
            title: 'T', description: 'D', content: 'C', shortContent: '', usageExample: '',
            variableDefinitions: '', collectionId: 'col-1', tagIds: ['tag-1'], resultText: ''
        };

        const { uploadFile } = await import('./files');
        (uploadFile as any).mockResolvedValue({ filePath: '/res.png', fileType: 'image/png' });

        // Redefine mockFile locally since previous scope is closed
        const localMockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        Object.defineProperty(localMockFile, 'size', { value: 1024 });

        await createPromptService('u-1', input, [], [localMockFile]); // Has result image

        expect(uploadFile).toHaveBeenCalled();
        expect(prisma.prompt.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                tags: { connect: [{ id: 'tag-1' }] },
                collections: { connect: { id: 'col-1' } }
            })
        }));
    });
});

describe('Delete Prompt Tags Cleanup', () => {
    it('should delete orphaned tags using batch delete', async () => {
        // 1. Auth check
        (prisma.prompt.findUnique as any)
            .mockResolvedValueOnce({ id: 'p-1', createdById: 'u-1' }); // Check

        (prisma.user.findUnique as any).mockResolvedValue({ id: 'u-1', role: 'USER' });

        (prisma.prompt.findUnique as any)
            .mockResolvedValueOnce({ id: 'p-1', versions: [] }) // Cleanup
            .mockResolvedValueOnce({ id: 'p-1', createdById: 'u-1', tags: [{ id: 't-1' }] }); // Get tags

        // 2. tagsInUse check: Return EMPTY array, meaning t-1 is NOT in use by any other prompt
        (prisma.tag.findMany as any).mockResolvedValue([]);

        await deletePromptService('u-1', 'p-1');

        // Expect batch delete
        expect(prisma.tag.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['t-1'] } } });
    });
});

describe('movePromptService', () => {
    const userId = 'u-1';
    const promptId = 'p-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update prompt collections when collectionId is provided', async () => {
        const { movePromptService } = await import('./prompts');
        (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: userId });

        await movePromptService(userId, promptId, 'col-2');

        expect(prisma.prompt.update).toHaveBeenCalledWith({
            where: { id: promptId },
            data: { collections: { set: [{ id: 'col-2' }] } }
        });
    });

    it('should clear collections when collectionId is null (Unassigned)', async () => {
        const { movePromptService } = await import('./prompts');
        (prisma.prompt.findUnique as any).mockResolvedValue({ id: promptId, createdById: userId });

        await movePromptService(userId, promptId, null);

        expect(prisma.prompt.update).toHaveBeenCalledWith({
            where: { id: promptId },
            data: { collections: { set: [] } }
        });
    });

    it('should throw "Prompt is locked" if locked and not owner', async () => {
        const { movePromptService } = await import('./prompts');
        (prisma.prompt.findUnique as any).mockResolvedValue({
            id: promptId,
            createdById: 'other-user',
            isLocked: true
        });

        await expect(movePromptService(userId, promptId, 'col-2')).rejects.toThrow("Prompt is locked by the creator.");
    });
});

describe('restoreVersionService', () => {
    const userId = 'u-1';
    const promptId = 'p-1';
    const versionId = 'v-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a new version based on the old one', async () => {
        const { restoreVersionService } = await import('./prompts');

        // 1. Prompt lookup
        (prisma.prompt.findUnique as any).mockResolvedValueOnce({ id: promptId, title: 'Title', createdById: userId, versions: [{ id: versionId }] });

        // 2. Source version lookup
        (prisma.promptVersion.findUnique as any).mockResolvedValueOnce({
            id: versionId,
            promptId: promptId,
            versionNumber: 1,
            content: 'Old Content',
            shortContent: 'Old Short',
            usageExample: 'Old Usage',
            attachments: [{ id: 'att-1', role: 'ATTACHMENT', filePath: '/old.txt' }]
        });

        // 3. createVersionService internal calls (prompt lookup for version number)
        (prisma.prompt.findUnique as any).mockResolvedValueOnce({ id: promptId, versions: [{ versionNumber: 5 }] }); // current head is v5

        // 4. Create response
        (prisma.promptVersion.create as any).mockResolvedValue({ id: 'v-6', versionNumber: 6 });

        // 5. Attachment lookup (for keepAttachmentIds)
        (prisma.attachment.findMany as any).mockResolvedValue([{ id: 'att-1', filePath: '/old.txt', fileType: 'text/plain' }]);

        await restoreVersionService(userId, promptId, versionId);

        // Verify we called create with old content and incremented version
        expect(prisma.promptVersion.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                content: 'Old Content',
                versionNumber: 6,
                changelog: expect.stringContaining('Restored from version 1'),
                attachments: {
                    create: expect.arrayContaining([
                        expect.objectContaining({ filePath: '/old.txt' })
                    ])
                }
            })
        }));
    });
});
