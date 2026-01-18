/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    Unlock: () => <div data-testid="icon-unlock" />,
    Lock: () => <div data-testid="icon-lock" />,
    Link: () => <div data-testid="icon-link" />
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

vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

// Mock child components that are heavy or irrelevant for shallow testing
vi.mock('./ConfirmationDialog', () => ({ default: () => <div data-testid="confirmation-dialog" /> }));
vi.mock('./VisualDiff', () => ({ default: () => <div data-testid="visual-diff" /> }));
vi.mock('./LinkPromptModal', () => ({ default: () => <div data-testid="link-prompt-modal" /> }));
vi.mock('./LinkPromptDialog', () => ({ default: () => <div data-testid="link-prompt-dialog" /> }));
vi.mock('./PromptCard', () => ({ default: () => <div data-testid="prompt-card" /> }));

// Real Hooks Mocking
// We need to mock usePromptDetails because PromptDetail relies on it for state.
// We'll use a factory to allow overriding returns in specific tests if needed, 
// but for now a static mock is fine for basic structure.

const defaultMockUsePromptDetails = {
    selectedVersionId: 'v1',
    setSelectedVersionId: vi.fn(),
    selectedVersion: {
        id: 'v1',
        versionNumber: 1,
        content: 'Content',
        shortContent: '',
        usageExample: '',
        resultText: '',
        resultImage: '',
        changelog: 'Initial version',
        attachments: [],
        createdAt: new Date(),
        createdBy: { username: 'testuser' }
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
};

vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: vi.fn(() => defaultMockUsePromptDetails)
}));

import * as promptActions from '@/actions/prompts';
vi.mock('@/actions/prompts', () => ({
    toggleVisibility: vi.fn(),
    toggleLock: vi.fn(),
    unlinkPrompts: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "user1", role: "USER" } },
        status: "authenticated",
    }),
}));

describe('PromptDetail', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        description: 'Test Description',
        createdById: 'user1',
        createdAt: new Date(),
        createdBy: { username: 'testuser' },
        versions: [],
        collections: [],
        isPrivate: false,
        tags: []
    };

    it('renders prompt detail with basic info', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} currentUser={{ id: 'user1', role: 'USER' }} />);

        expect(screen.getByText('Test Prompt')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        // Check for header buttons by title (using logic from component)
        expect(screen.getByTitle('detail.actions.addToFavorites')).toBeInTheDocument();
    });

    it('renders visibility toggle for creator when enabled', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} currentUser={{ id: 'user1', role: 'USER' }} />);
        // prompt.isPrivate is false, so it shows "Make Private" (Eye icon)
        const toggleBtn = screen.getByTitle('Make Private');
        expect(toggleBtn).toBeInTheDocument();
    });

    it('calls toggleVisibility action on click', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} currentUser={{ id: 'user1', role: 'USER' }} />);
        const toggleBtn = screen.getByTitle('Make Private');
        fireEvent.click(toggleBtn);
        expect(promptActions.toggleVisibility).toHaveBeenCalledWith('p1');
    });

    it('renders layout elements (Responsive Check)', () => {
        render(<PromptDetail prompt={mockPrompt} privatePromptsEnabled={true} currentUser={{ id: 'user1', role: 'USER' }} />);
        // Just ensure the main areas are present
        expect(screen.getByText('detail.labels.description')).toBeInTheDocument();
        expect(screen.getByText('detail.labels.promptContent')).toBeInTheDocument();
        expect(screen.getByText('detail.labels.history')).toBeInTheDocument();
    });
});
