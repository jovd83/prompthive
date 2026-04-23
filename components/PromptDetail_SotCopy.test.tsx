
/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptDetail from './PromptDetail';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '@/lib/clipboard';

// Mock clipboard
vi.mock('@/lib/clipboard', () => ({
    copyToClipboard: vi.fn(() => Promise.resolve(true)),
}));

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
    FileDown: () => <div data-testid="icon-file-down" />,
    Eye: () => <div data-testid="icon-eye" />,
    EyeOff: () => <div data-testid="icon-eye-off" />,
    Loader2: () => <div data-testid="icon-loader" />,
    Lock: () => <div data-testid="icon-lock" />,
    Unlock: () => <div data-testid="icon-unlock" />,
    RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
    ShieldCheck: () => <div data-testid="icon-shield-check" />,
    ChevronDown: () => <div data-testid="icon-chevron-down" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />,
    Package: () => <div data-testid="icon-package" />,
    Terminal: () => <div data-testid="icon-terminal" />,
    Link: () => <div data-testid="icon-link" />,
    Sparkles: () => <div data-testid="icon-sparkles" />,
    Zap: () => <div data-testid="icon-zap" />,
    ExternalLink: () => <div data-testid="icon-external-link" />,
    Library: () => <div data-testid="icon-library" />,
    Database: () => <div data-testid="icon-database" />,
    Users: () => <div data-testid="icon-users" />,
    RefreshCw: () => <div data-testid="icon-refresh-cw" />,
    Globe: () => <div data-testid="icon-globe" />,
}));

// Mock useLanguage
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
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

// Mock useSession
vi.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { id: "user1", role: "USER" } },
        status: "authenticated",
    }),
}));

// Mock usePromptDetails
vi.mock('@/hooks/usePromptDetails', () => ({
    usePromptDetails: vi.fn(() => ({
        selectedVersionId: 'v1',
        setSelectedVersionId: vi.fn(),
        selectedVersion: {
            id: 'v1',
            versionNumber: 1,
            content: 'Hello {{name}}',
            agentUsage: 'Use Agent X',
            tags: []
        },
        variables: { name: 'World' },
        fillVariable: vi.fn(),
        isFavorited: false,
        handleToggleFavorite: vi.fn(),
        isDeleting: false,
        setIsDeleting: vi.fn(),
        confirmDelete: vi.fn(),
        error: null,
        diffConfig: null,
        setDiffConfig: vi.fn(),
        variableDefs: [{ key: 'name', description: 'Name var' }],
        uniqueVars: ['name']
    }))
}));

// Mock fetch
global.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));

describe('PromptDetail SOT Copy Logic', () => {
    const mockPrompt: any = {
        id: 'p1',
        title: 'Test Prompt',
        technicalId: 'T-100',
        viewCount: 123,
        copyCount: 45,
        createdById: 'user1',
        createdAt: new Date(),
        createdBy: { username: 'testuser' },
        versions: [{ id: 'v1', versionNumber: 1 }],
        collections: [],
        isPrivate: false,
        tags: []
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Advanced Copy trigger', () => {
        render(<PromptDetail prompt={mockPrompt} />);
        expect(screen.getByTitle('Advanced Copy Options')).toBeInTheDocument();
    });

    it('calls handleCopy with withSot=true when selected in advanced menu', async () => {
        render(<PromptDetail prompt={mockPrompt} />);
        
        // 1. Open dropdown
        const trigger = screen.getByTitle('Advanced Copy Options');
        fireEvent.click(trigger);

        // 2. Click SOT policy checkbox
        const sotCheckbox = screen.getByText('detail.actions.addSotPolicy');
        fireEvent.click(sotCheckbox);

        // 3. Click Copy Selected
        const copyBtn = screen.getByText('detail.actions.copySelected');
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(copyToClipboard).toHaveBeenCalled();
            const calledContent = (copyToClipboard as any).mock.calls[0][0];
            // The policy text comes from formatAdvancedPrompt in lib/copy-utils.ts
            expect(calledContent).toContain('SOURCE-OF-TRUTH CHECK');
            expect(calledContent).toContain('Hello World');
            expect(calledContent).toContain('Use Agent X');
        });
    });

    it('triggers the copy_advanced analytics event when using advanced menu', async () => {
        render(<PromptDetail prompt={mockPrompt} />);
        
        const trigger = screen.getByTitle('Advanced Copy Options');
        fireEvent.click(trigger);

        const sotCheckbox = screen.getByText('detail.actions.addSotPolicy');
        fireEvent.click(sotCheckbox);

        const copyBtn = screen.getByText('detail.actions.copySelected');
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
                body: expect.stringContaining('"type":"copy_advanced"')
            }));
        });
    });

    it('shows success message after successful copy', async () => {
        render(<PromptDetail prompt={mockPrompt} />);
        
        // Just click regular copy for simplicity to test the success state
        const copyBtn = screen.getByText('detail.actions.copy');
        fireEvent.click(copyBtn);

        await waitFor(() => {
            expect(screen.getByText('detail.actions.copied')).toBeInTheDocument();
            expect(screen.getByTestId('icon-check')).toBeInTheDocument();
        });
    });
});
