/**
 * @vitest-environment jsdom
 */
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
    Eye: () => <div data-testid="icon-eye" />,
    EyeOff: () => <div data-testid="icon-eye-off" />,
    Loader2: () => <div data-testid="icon-loader" />,
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

// Mock child components
vi.mock('./prompt-detail/PromptContent', () => ({ default: () => <div data-testid="prompt-content" /> }));
vi.mock('./prompt-detail/PromptSidebar', () => ({ default: () => <div data-testid="prompt-sidebar" /> }));
vi.mock('./ConfirmationDialog', () => ({ default: () => <div data-testid="confirmation-dialog" /> }));
vi.mock('./VisualDiff', () => ({ default: () => <div data-testid="visual-diff" /> }));
vi.mock('./LinkPromptModal', () => ({ default: () => <div data-testid="link-prompt-modal" /> }));
vi.mock('./CollapsibleSection', () => ({ default: ({ children }: any) => <div data-testid="collapsible-section">{children}</div> }));
vi.mock('./ExpandableTextarea', () => ({ default: () => <div data-testid="expandable-textarea" /> }));
vi.mock('./CodeEditor', () => ({ default: () => <div data-testid="code-editor" /> }));

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

// Mock actions
import * as promptActions from '@/actions/prompts';
vi.mock('@/actions/prompts', () => ({
    createTag: vi.fn(),
    createPrompt: vi.fn(),
    createVersion: vi.fn(),
    restorePromptVersion: vi.fn(),
    deletePrompt: vi.fn(),
    deleteUnusedTags: vi.fn(),
    cleanupPromptAssets: vi.fn(),
    movePrompt: vi.fn(),
    bulkMovePrompts: vi.fn(),
    bulkAddTags: vi.fn(),
    toggleLock: vi.fn(),
    toggleVisibility: vi.fn(),
    linkPrompts: vi.fn(),
    unlinkPrompts: vi.fn(),
    searchCandidatePrompts: vi.fn(),
    toggleFavorite: vi.fn(),
}));

// Mock useSession
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "user1", role: "USER" } },
        status: "authenticated",
    }),
}));

describe.skip('PromptDetail', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        createdById: 'user1',
        createdAt: new Date(),
        createdBy: { username: 'testuser' },
        versions: [],
        collections: [],
        isPrivate: false
    };

    it('renders prompt detail with child components', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} />);
        expect(screen.getByTestId('prompt-content')).toBeInTheDocument();
        expect(screen.getByTestId('prompt-sidebar')).toBeInTheDocument();
    });

    it('renders visibility toggle for creator when enabled', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} />);
        // Should show "Make Private" (Eye) because default is public
        const toggleBtn = screen.getByTitle('Make Private');
        expect(toggleBtn).toBeInTheDocument();
        expect(screen.getByTestId('icon-eye')).toBeInTheDocument();
    });

    it('calls toggleVisibility action on click', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} />);
        const toggleBtn = screen.getByTitle('Make Private');
        fireEvent.click(toggleBtn);
        expect(promptActions.toggleVisibility).toHaveBeenCalledWith('p1');
    });

    it('does NOT render visibility toggle when disabled globally', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={false} />);
        const toggleBtn = screen.queryByTitle('Make Private');
        expect(toggleBtn).not.toBeInTheDocument();
    });
});

