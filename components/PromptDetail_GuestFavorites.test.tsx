/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import PromptDetail from './PromptDetail';
import { describe, it, expect, vi } from 'vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Heart: () => <div data-testid="icon-heart" />,
    // Mock other icons to avoid errors
    Copy: () => <div />,
    Edit: () => <div />,
    History: () => <div />,
    FileText: () => <div />,
    Check: () => <div />,
    Paperclip: () => <div />,
    Download: () => <div />,
    Code2: () => <div />,
    Trash2: () => <div />,
    GitCompare: () => <div />,
    Maximize2: () => <div />,
    X: () => <div />,
    FileDown: () => <div />,
    RotateCcw: () => <div />,
    Lock: () => <div />,
    Unlock: () => <div />,
    Loader2: () => <div />,
    Eye: () => <div />,
    EyeOff: () => <div />,
    Link: () => <div />,
}));

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({ t: (key: string) => key, language: 'en' }),
}));

// Mock child components to simplify
vi.mock('./CollapsibleSection', () => ({ default: () => <div /> }));
vi.mock('./ExpandableTextarea', () => ({ default: () => <div /> }));
vi.mock('./CodeEditor', () => ({ default: () => <div /> }));
vi.mock('./VisualDiff', () => ({ default: () => <div /> }));
vi.mock('./LinkPromptDialog', () => ({ default: () => <div /> }));
vi.mock('./PromptCard', () => ({ default: () => <div /> }));
vi.mock('./ConfirmationDialog', () => ({ default: () => <div /> }));

// Mock hook
vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: () => ({
        selectedVersionId: 'v1',
        setSelectedVersionId: vi.fn(),
        selectedVersion: {
            id: 'v1',
            versionNumber: 1,
            content: 'Content',
            createdAt: new Date(),
            createdBy: { username: 'creator' },
            attachments: [],
        },
        variables: {},
        fillVariable: vi.fn(),
        isFavorited: false, // Not favored initially
        handleToggleFavorite: vi.fn(),
        isDeleting: false,
        setIsDeleting: vi.fn(),
        confirmDelete: vi.fn(),
        error: null,
        setError: vi.fn(),
        diffConfig: null,
        setDiffConfig: vi.fn(),
        variableDefs: [],
        uniqueVars: []
    })
}));

// Mock useSession default (can be overridden in tests using vi.mocked or separate files, but for single file use factory if needed)
// We will rely on passing currentUser prop mainly, as that is the fix.
// But we can also verify useSession fallback.

const mockSession = {
    data: { user: { id: "guest1", role: "GUEST" } },
    status: "authenticated",
};

vi.mock("next-auth/react", () => ({
    useSession: () => mockSession,
}));


describe('PromptDetail Guest Favorites', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        createdById: 'user2',
        createdAt: new Date(),
        createdBy: { username: 'creator' },
        versions: [{ id: 'v1', versionNumber: 1, content: 'Content', createdBy: { username: 'creator' }, createdAt: new Date() }],
        collections: [],
        isLocked: false,
    };

    it('disables favorite button for GuestUser passed via prop', () => {
        const guestUser = { id: 'guest1', role: 'GUEST' };

        render(<PromptDetail prompt={mockPrompt} currentUser={guestUser} />);

        const btn = screen.getByTitle(/guestNoFavorite|Guests cannot favorite/);
        expect(btn).toBeInTheDocument();
        expect(btn).toBeDisabled();
    });

    it('enables favorite button for RegularUser passed via prop', () => {
        const regularUser = { id: 'user1', role: 'USER' };

        render(<PromptDetail prompt={mockPrompt} currentUser={regularUser} />);

        // Title should be normal
        const btn = screen.getByTitle('detail.actions.addToFavorites');
        expect(btn).toBeInTheDocument();
        expect(btn).not.toBeDisabled();
    });

    it('disables favorite button if useSession returns GUEST (fallback)', () => {
        // mockSession is configured as GUEST above
        render(<PromptDetail prompt={mockPrompt} />);

        const btn = screen.getByTitle(/guestNoFavorite|Guests cannot favorite/);
        expect(btn).toBeInTheDocument();
        expect(btn).toBeDisabled();
    });
});
