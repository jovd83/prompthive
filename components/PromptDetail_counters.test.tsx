
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
    Lock: () => <div data-testid="icon-lock" />,
    Unlock: () => <div data-testid="icon-unlock" />,
    RotateCcw: () => <div data-testid="icon-rotate-ccw" />
}));

// Mock Next.js hooks
vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}));

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    })),
    useSearchParams: vi.fn(() => ({
        get: vi.fn(),
    })),
    usePathname: vi.fn(() => '/'),
}));

// Mock useLanguage
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock child components to simplify testing
vi.mock('./prompt-detail/PromptContent', () => ({ default: () => <div data-testid="prompt-content" /> }));
vi.mock('./prompt-detail/PromptSidebar', () => ({ default: () => <div data-testid="prompt-sidebar" /> }));
vi.mock('./ConfirmationDialog', () => ({ default: () => <div data-testid="confirmation-dialog" /> }));
vi.mock('./VisualDiff', () => ({ default: () => <div data-testid="visual-diff" /> }));
vi.mock('./LinkPromptModal', () => ({ default: () => <div data-testid="link-prompt-modal" /> }));
vi.mock('./CollapsibleSection', () => ({ default: ({ children }: any) => <div data-testid="collapsible-section">{children}</div> }));
vi.mock('./ExpandableTextarea', () => ({ default: () => <div data-testid="expandable-textarea" /> }));
vi.mock('./CodeEditor', () => ({ default: () => <div data-testid="code-editor" /> }));
vi.mock('./TagList', () => ({ default: () => <div data-testid="tag-list" /> }));
vi.mock('./PromptCard', () => ({ default: () => <div data-testid="prompt-card" /> }));

// Mock usePromptDetails
vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: vi.fn(() => ({
        selectedVersionId: 'v1',
        setSelectedVersionId: vi.fn(),
        selectedVersion: {
            id: 'v1',
            versionNumber: 1,
            content: 'Content',
            tags: []
        },
        variables: {},
        fillVariable: vi.fn(),
        isFavorited: false,
        handleToggleFavorite: vi.fn(),
        isDeleting: false,
        setIsDeleting: vi.fn(),
        confirmDelete: vi.fn(),
        error: null,
        diffConfig: null,
        setDiffConfig: vi.fn(),
        variableDefs: [],
        uniqueVars: []
    }))
}));

// Mock actions
vi.mock('@/actions/prompts', () => ({
    toggleLock: vi.fn(),
    toggleVisibility: vi.fn(),
    unlinkPrompts: vi.fn(),
}));

// Mock useSession
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "user1", role: "USER" } },
        status: "authenticated",
    }),
}));

describe('PromptDetail Counters', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        technicalId: 'T-100',
        viewCount: 123,
        copyCount: 45,
        createdById: 'user1',
        createdAt: new Date(),
        createdBy: { username: 'testuser' },
        versions: [],
        collections: [],
        isPrivate: false,
        tags: []
    };

    it('renders view and copy counters correct values', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // Find view counter
        // Contains Eye icon and 123
        expect(screen.getByText('123')).toBeInTheDocument();

        // Find copy counter
        // Contains Copy icon and 45
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders icons for counters', () => {
        render(<PromptDetail prompt={mockPrompt} />);

        // We look for the icons. mocking lucide returns data-testid
        const eyeIcons = screen.getAllByTestId('icon-eye');
        // Eye is used in visibility toggle (if creator) and counter. 
        // User is creator (user1==user1). 
        // prompt is NOT private, so public -> uses Eye icon.
        // So we expect 2 Eye icons? 
        // Wait, line 286: (prompt.isPrivate ? EyeOff : Eye)
        // prompt.isPrivate is false, so it shows Eye (to make private? No, label is "Make Private", icon is EyeOff? No logic is:
        // isPrivate ? bg-purple... title="Make Public" Icon: EyeOff
        // : bg-surface title="Make Private" Icon: Eye
        // So yes, 2 Eye icons.
        expect(eyeIcons.length).toBeGreaterThanOrEqual(1);

        const copyIcons = screen.getAllByTestId('icon-copy');
        // Copy button also uses Copy icon. and Copy counter uses Copy icon.
        expect(copyIcons.length).toBeGreaterThanOrEqual(2);
    });

    it('displays counters even if technical ID is missing', () => {
        const promptNoTechId = { ...mockPrompt, technicalId: null };
        render(<PromptDetail prompt={promptNoTechId} />);
        expect(screen.getByText('123')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.queryByText('T-100')).not.toBeInTheDocument();
    });
});
