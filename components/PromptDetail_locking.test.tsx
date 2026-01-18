
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
    RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
    Lock: () => <div data-testid="icon-lock" />,
    Unlock: () => <div data-testid="icon-unlock" />,
    Loader2: () => <div data-testid="icon-loader" />,
    Eye: () => <div data-testid="icon-eye" />,
    EyeOff: () => <div data-testid="icon-eye-off" />,
    Link: () => <div data-testid="icon-link" />
}));

// Mock Next.js hooks
vi.mock('next/link', () => ({
    default: ({ children, href, className, title }: any) => (
        <a href={href} className={className} title={title}>{children}</a>
    ),
}));

// Mock next/navigation (App Router)
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/prompt/p1',
}));

// Mock useLanguage
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock useSession
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "user1", role: "USER" } },
        status: "authenticated",
    }),
}));

// Mock usePromptDetails
vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: ({ prompt }: any) => ({
        selectedVersionId: 'v1',
        setSelectedVersionId: vi.fn(),
        selectedVersion: prompt.versions[0],
        variables: {},
        fillVariable: vi.fn(),
        isFavorited: false,
        handleToggleFavorite: vi.fn(),
        isDeleting: false, // Ensure we see the delete button, not confirmation
        setIsDeleting: vi.fn(),
        confirmDelete: vi.fn(),
        error: null,
        setDiffConfig: vi.fn(),
        variableDefs: [],
        uniqueVars: []
    })
}));

// Mock actions
vi.mock('@/actions/prompts', () => ({
    toggleLock: vi.fn(),
    toggleVisibility: vi.fn(),
    unlinkPrompts: vi.fn(),
}));

// Mock other components
vi.mock('./ConfirmationDialog', () => ({ default: () => null }));
vi.mock('./LinkPromptDialog', () => ({ default: () => null }));
vi.mock('./CodeEditor', () => ({ default: () => null }));
vi.mock('./CollapsibleSection', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('./ExpandableTextarea', () => ({ default: () => null }));
vi.mock('./VisualDiff', () => ({ default: () => null }));

describe('PromptDetail Locking', () => {

    it('enables delete button when prompt is UNLOCKED', () => {
        const mockPrompt: any = {
            id: 'p1',
            title: 'Test Prompt',
            createdById: 'user1',
            isLocked: false,
            createdAt: new Date(),
            createdBy: { username: 'testuser' },
            versions: [{ id: 'v1', versionNumber: 1, content: 'test', createdAt: new Date() }],
            collections: []
        };

        render(<PromptDetail prompt={mockPrompt} />);

        // Find by delete action title key
        const deleteBtn = screen.getByTitle('detail.actions.delete');
        expect(deleteBtn).toBeInTheDocument();
        expect(deleteBtn).not.toBeDisabled();
    });

    it('disables delete button when prompt is LOCKED', () => {
        const mockPrompt: any = {
            id: 'p1',
            title: 'Test Prompt',
            createdById: 'user1',
            isLocked: true,
            createdAt: new Date(),
            createdBy: { username: 'testuser' },
            versions: [{ id: 'v1', versionNumber: 1, content: 'test', createdAt: new Date() }],
            collections: []
        };

        render(<PromptDetail prompt={mockPrompt} />);

        // Find by trash icon to ensure we get the button, not likely the edit link
        const trashIcon = screen.getByTestId('icon-trash-2');
        const deleteBtn = trashIcon.closest('button');

        // Check title and disabled state
        expect(deleteBtn).toHaveAttribute('title', 'detail.actions.lockedByCreator');
        expect(deleteBtn).toBeDisabled();
        expect(deleteBtn).toHaveClass('pointer-events-none');
    });
});
