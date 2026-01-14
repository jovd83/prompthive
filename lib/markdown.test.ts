// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { generateMarkdown } from './markdown';
import { PromptWithRelations } from '@/types/prisma';

describe('generateMarkdown', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        description: 'A description',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        createdById: 'u1',
        viewCount: 0,
        copyCount: 0,
        resource: 'https://example.com',
        currentVersionId: 'v1',
        isLocked: false,
        technicalId: null,
        createdBy: {
            id: 'u1',
            username: 'tester',
            email: 'test@example.com',
            role: 'USER',
            language: 'en',
            avatarUrl: null,
            passwordHash: 'hash',
            resetToken: null,
            resetTokenExpires: null,
            createdAt: new Date()
        },
        tags: [{ id: 't1', name: 'tag1', createdAt: new Date() }],
        collections: [{ id: 'c1', title: 'Collection 1', description: null, ownerId: 'u1', parentId: null, createdAt: new Date(), parent: null }],
        versions: [
            {
                id: 'v1',
                promptId: 'p1',
                content: 'Hello {{name}}',
                shortContent: 'Extended content',
                usageExample: 'Example usage',
                variableDefinitions: JSON.stringify([{ key: 'name', description: 'User name' }]),
                versionNumber: 1,
                createdById: 'u1',
                createdAt: new Date('2024-01-01'),
                changelog: 'Initial',
                model: null,
                resultImage: null,
                resultText: null,
                createdBy: {
                    id: 'u1',
                    username: 'tester',
                    email: 'test@example.com',
                    role: 'USER',
                    language: 'en',
                    avatarUrl: null,
                    passwordHash: '',
                    resetToken: null,
                    resetTokenExpires: null,
                    createdAt: new Date()
                },
                attachments: [
                    { id: 'a1', versionId: 'v1', filePath: '/uploads/file1.txt', fileType: 'txt', originalName: 'file1.txt', role: 'ATTACHMENT', createdAt: new Date() },
                    { id: 'a2', versionId: 'v1', filePath: '/uploads/result.png', fileType: 'png', originalName: 'result.png', role: 'RESULT', createdAt: new Date() }
                ]
            }
        ],


    };

    it('generates correct markdown structure', () => {
        const md = generateMarkdown(mockPrompt, 'v1');

        expect(md).toContain('# Test Prompt');
        expect(md).toContain('> A description');
        expect(md).toContain('**Version:** 1');
        expect(md).toContain('**Author:** tester');
        expect(md).toContain('**Tags:** #tag1');

        expect(md).toContain('## Prompt Content');
        expect(md).toContain('Hello {{name}}');

        expect(md).toContain('## Short Prompt');
        expect(md).toContain('Extended content');

        expect(md).toContain('## Usage Example');
        expect(md).toContain('Example usage');

        expect(md).toContain('## Variables');
        expect(md).toContain('| name | User name |');

        expect(md).toContain('## Metadata');
        expect(md).toContain('**Collection:** Collection 1');
        expect(md).toContain('**Source:** https://example.com');

        expect(md).toContain('## Attachments');
        expect(md).toContain('*   file1.txt');
        expect(md).toContain('*   result.png');
    });

    it('handles missing optional fields', () => {
        const minimalPrompt = {
            ...mockPrompt,
            description: null,
            resource: null,
            tags: [],
            collections: [],
            versions: [{
                ...mockPrompt.versions[0],
                shortContent: null,
                usageExample: null,
                variableDefinitions: null,
                resultImage: '/legacy.png',
                attachments: []
            }]
        };

        const md = generateMarkdown(minimalPrompt, 'v1');

        expect(md).toContain('> No description provided.');
        expect(md).toContain('Tags:** None');
        expect(md).not.toContain('## Short Prompt');
        expect(md).not.toContain('## Usage Example');
        expect(md).not.toContain('## Variables');
        expect(md).toContain('**Collection:** None');
        expect(md).toContain('**Source:** None');
        expect(md).toContain('*   legacy.png');
    });
});


import { downloadStringAsFile } from './markdown';
import { vi } from 'vitest';

describe('downloadStringAsFile', () => {
    it('creates a blob link and clicks it', () => {
        // Mocks
        const mockLink = {
            href: '',
            download: '',
            click: vi.fn(),
        };
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
        const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
        const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

        global.URL.createObjectURL = vi.fn(() => 'blob:url');
        global.URL.revokeObjectURL = vi.fn();

        // Act
        downloadStringAsFile('# content', 'test.md');

        // Assert
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockLink.download).toBe('test.md');
        expect(mockLink.href).toBe('blob:url');
        expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
        expect(mockLink.click).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');

        // Cleanup
        vi.restoreAllMocks();
    });
});
