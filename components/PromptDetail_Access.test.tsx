/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
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
    Link: () => <div data-testid="icon-link" />,
    Unlock: () => <div data-testid="icon-unlock" />,
    Lock: () => <div data-testid="icon-lock" />,
}));

// Mock Next.js hooks
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
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
vi.mock('./LinkPromptDialog', () => ({ default: () => <div data-testid="link-prompt-dialog" /> }));
vi.mock('./CollapsibleSection', () => ({ default: ({ children }: any) => <div data-testid="collapsible-section">{children}</div> }));
vi.mock('./ExpandableTextarea', () => ({ default: () => <div data-testid="expandable-textarea" /> }));
vi.mock('./CodeEditor', () => ({ default: () => <div data-testid="code-editor" /> }));
vi.mock('./PromptCard', () => ({ default: () => <div data-testid="prompt-card" /> }));

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

// Mock useSession as GUEST
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "guest-user", role: "GUEST" } },
        status: "authenticated",
    }),
}));

describe('PromptDetail Guest Access', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        createdById: 'user1', // Not the guest user
        createdAt: new Date(),
        createdBy: { username: 'user1' },
        versions: [],
        collections: [],
        isPrivate: false,
        isLocked: false // Not locked
    };

    it('should disable delete button for GUEST user', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // When disabled/cannot edit, title changes to 'detail.actions.lockedByCreator' (reused for disabled state)
        // We verify that the normal delete title DOES NOT exist, and the locked title DOES exist and is disabled.
        expect(screen.queryByTitle('detail.actions.delete')).not.toBeInTheDocument();

        const deleteButton = screen.getByTitle('detail.actions.lockedByCreator');
        expect(deleteButton).toBeDisabled();
    });
});
