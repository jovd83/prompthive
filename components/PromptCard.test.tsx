import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptCard from './PromptCard';
import { SessionProvider, signIn } from 'next-auth/react';
import { toggleFavorite } from '@/actions/favorites';

// Mock Server Actions
vi.mock('@/actions/favorites', () => ({
    toggleFavorite: vi.fn(),
}));

// Mock NextAuth
vi.mock('next-auth/react', async () => {
    const actual = await vi.importActual('next-auth/react');
    return {
        ...actual,
        signIn: vi.fn(),
    };
});

// Mock LanguageProvider
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        language: 'en',
        t: (key: string) => {
            const map: Record<string, string> = {
                'prompts.addToFavorites': 'Add to favorites',
                'prompts.removeFromFavorites': 'Remove from favorites',
                'prompts.copyContent': 'Copy prompt content',
                'list.copied': 'Copied',
                'list.copy': 'Copy',
                'prompts.noContent': 'No content',
                // Add default returns for others to avoid confusing output if needed, but key is fallback usually fine
            };
            return map[key] || key;
        }
    })
}));

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: vi.fn(),
    }),
}));

// Mock Link
vi.mock('next/link', () => ({
    default: ({ href, children, onClick }: any) => <a href={href} onClick={onClick}>{children}</a>
}));

// Mock Clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
    },
});

describe('PromptCard', () => {
    const mockPrompt = {
        id: '123',
        title: 'Test Prompt',
        description: 'A test description',
        tags: [{ id: 't1', name: 'Tag1' }],
        viewCount: 10,
        copyCount: 5,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        createdBy: { email: 'test@example.com' },
        versions: [{ content: 'Prompt Content', resultImage: null }]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders basic info', () => {
        render(
            <SessionProvider session={null}>
                <PromptCard prompt={mockPrompt} />
            </SessionProvider>
        );
        expect(screen.getByText('Test Prompt')).toBeInTheDocument();
        expect(screen.getByText('A test description')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getAllByText('Prompt Content').length).toBeGreaterThan(0);
    });

    it('navigates to prompt detail on card click', () => {
        render(
            <SessionProvider session={null}>
                <PromptCard prompt={mockPrompt} />
            </SessionProvider>
        );
        fireEvent.click(screen.getByText('Test Prompt'));
        expect(pushMock).toHaveBeenCalledWith('/prompts/123');
    });

    it('renders tags with links', () => {
        render(
            <SessionProvider session={null}>
                <PromptCard prompt={mockPrompt} />
            </SessionProvider>
        );
        const tag = screen.getByText('#Tag1');
        expect(tag.closest('a')).toHaveAttribute('href', '/?tags=t1');
    });

    it('handles favorite toggle', async () => {
        (toggleFavorite as any).mockResolvedValue({ isFavorite: true });

        render(
            <SessionProvider session={{ user: { id: 'u1' } } as any}>
                <PromptCard prompt={mockPrompt} isFavorited={false} />
            </SessionProvider>
        );

        const favBtn = screen.getByTitle('Add to favorites');
        fireEvent.click(favBtn);

        await waitFor(() => {
            expect(toggleFavorite).toHaveBeenCalledWith('123');
        });
    });

    it('handles copy functionality', async () => {
        render(
            <SessionProvider session={null}>
                <PromptCard prompt={mockPrompt} />
            </SessionProvider>
        );

        const copyBtn = screen.getByTitle('Copy prompt content');
        fireEvent.click(copyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Prompt Content');
        await waitFor(() => {
            expect(screen.getByText('Copied')).toBeInTheDocument();
        });
    });
    it('redirects to sign in if favoriting without session', async () => {
        render(
            <SessionProvider session={null}>
                <PromptCard prompt={mockPrompt} />
            </SessionProvider>
        );

        const favBtn = screen.getByTitle('Add to favorites');
        fireEvent.click(favBtn);

        expect(signIn).toHaveBeenCalled();
        expect(toggleFavorite).not.toHaveBeenCalled();
    });
});

