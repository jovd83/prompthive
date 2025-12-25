import { render, screen, fireEvent } from '@testing-library/react';
import PromptDetail from './PromptDetail';
import { describe, it, expect, vi } from 'vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Copy: () => <div data-testid="icon-copy" />,
    Edit: () => <div data-testid="icon-edit" />,
    History: () => <div data-testid="icon-history" />,
    FileText: () => <div data-testid="icon-file-text" />,
    Check: () => <div data-testid="icon-check" />,
    Paperclip: () => <div data-testid="icon-paperclip" />,
    Download: () => <div data-testid="icon-download" />,
    Code2: () => <div data-testid="icon-code-2" />,
    Trash2: () => <div data-testid="icon-trash-2" />,
    GitCompare: () => <div data-testid="icon-git-compare" />,
    Heart: () => <div data-testid="icon-heart" />,
    Maximize2: () => <div data-testid="icon-maximize-2" />,
    X: () => <div data-testid="icon-x" />,
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />,
    FileDown: () => <div data-testid="icon-file-down" />,
}));

// Mock Next.js hooks
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

// Mock useLanguage
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock usePromptDetails
const mockFillVariable = vi.fn();
const mockVariables = { 'topic': 'initial value' };

vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: () => ({
        selectedVersionId: 'v1',
        setSelectedVersionId: vi.fn(),
        selectedVersion: {
            id: 'v1',
            versionNumber: 1,
            content: 'Write a blog about {{topic}}',
            createdAt: new Date(),
            createdBy: { username: 'testuser' }
        },
        variables: mockVariables,
        fillVariable: mockFillVariable,
        isFavorited: false,
        handleToggleFavorite: vi.fn(),
        isDeleting: false,
        setIsDeleting: vi.fn(),
        confirmDelete: vi.fn(),
        error: null,
        diffConfig: null,
        setDiffConfig: vi.fn(),
        variableDefs: [{ key: 'topic', description: 'Topic of the blog' }],
        uniqueVars: ['topic']
    })
}));

describe('PromptDetail', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        createdAt: new Date(),
        createdBy: { username: 'testuser' },
        versions: [],
        collections: []
    };

    it('renders variable input as textarea with maximize button', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // check for textarea
        const textarea = screen.getByDisplayValue('initial value');
        expect(textarea.tagName).toBe('TEXTAREA');

        // check for maximize button
        const maximizeBtn = screen.getByTitle('detail.actions.maximize');
        expect(maximizeBtn).toBeDefined();
    });

    it('opens modal on maximize click and allows editing', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // Click maximize
        const maximizeBtn = screen.getByTitle('detail.actions.maximize');
        fireEvent.click(maximizeBtn);

        // Check if modal appears (look for Editing Variable label)
        expect(screen.getByText('detail.labels.editingVariable:')).toBeDefined();

        // Check if textarea in modal has focus/value
        const modalTextarea = screen.getByPlaceholderText('detail.placeholders.enterLargeText');
        expect(modalTextarea).toBeDefined();
        expect(modalTextarea).toHaveValue('initial value');

        // Simulate typing
        fireEvent.change(modalTextarea, { target: { value: 'updated value' } });
        expect(mockFillVariable).toHaveBeenCalledWith('topic', 'updated value');
    });

    it('closes modal on done click', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // Open modal
        fireEvent.click(screen.getByTitle('detail.actions.maximize'));
        expect(screen.getByText('detail.labels.editingVariable:')).toBeDefined();

        // Close modal
        fireEvent.click(screen.getByText('detail.actions.done'));

        // Modal should be gone
        expect(screen.queryByText('detail.labels.editingVariable:')).toBeNull();
    });
});
