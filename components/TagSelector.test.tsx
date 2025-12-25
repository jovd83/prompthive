
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TagSelector from './TagSelector';
import { describe, it, expect, vi } from 'vitest';
import { createTag } from '@/actions/prompts';

// Mock creating tags
vi.mock('@/actions/prompts', () => ({
    createTag: vi.fn((name) => Promise.resolve({ id: 'new-tag', name }))
}));

// Mock language provider
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => {
            if (key === 'tags.create') return 'Create "{{tag}}"';
            return key;
        }
    })
}));

describe('TagSelector', () => {
    const mockTags = [
        { id: '1', name: 'Frontend' },
        { id: '2', name: 'Backend' },
    ];

    it('renders initial tags correctly', () => {
        render(<TagSelector initialTags={mockTags} selectedTagIds={['1']} />);
        expect(screen.getByText('Frontend')).toBeInTheDocument();
        expect(screen.queryByText('Backend')).not.toBeInTheDocument();
    });

    it('renders tags passed via initialSelectedTags even if not in initialTags (Bug Fix)', () => {
        const initialSelectedTags = [{ id: '99', name: 'Legacy Tag' }];
        render(<TagSelector initialTags={mockTags} initialSelectedTags={initialSelectedTags} />);
        expect(screen.getByText('Legacy Tag')).toBeInTheDocument();
    });

    it('filters available tags when typing', () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');

        fireEvent.change(input, { target: { value: 'Back' } });
        fireEvent.focus(input);

        expect(screen.getByText('Backend')).toBeInTheDocument();
        expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    });

    it('selects a tag from the list', () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');

        fireEvent.focus(input);
        fireEvent.click(screen.getByText('Frontend'));

        expect(screen.getByText('Frontend')).toBeInTheDocument();
        // Should clear input and close dropdown
        expect(input).toHaveValue('');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('removes a selected tag', () => {
        render(<TagSelector initialTags={mockTags} selectedTagIds={['1']} />);
        const removeBtn = screen.getByRole('button', { name: '' }); // X icon button usually has no text, might need aria-label in component for better finding, but looking for closest button works

        // Find the X button inside the tag
        const tag = screen.getByText('Frontend');
        const button = tag.querySelector('button');
        fireEvent.click(button!);

        expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
    });

    it('creates a new tag when not found', async () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');

        fireEvent.change(input, { target: { value: 'NewTopic' } });
        fireEvent.focus(input);

        // Expect create option
        const createOption = screen.getByText(/Create "NewTopic"/);
        fireEvent.click(createOption);

        await waitFor(() => {
            expect(createTag).toHaveBeenCalledWith('NewTopic');
        });

        // Should now be selected (mock returns id 'new-tag', name 'NewTopic' - but wait, the mock name arg is what matters)
        // Note: Our mock implementation just returns the name passed. 
        expect(screen.getByText('NewTopic')).toBeInTheDocument();
    });

    it('navigates with keyboard arrows', () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');
        fireEvent.focus(input);

        // Arrow Down to highlight first
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        // Arrow Down to highlight second
        fireEvent.keyDown(input, { key: 'ArrowDown' });

        // Enter to select
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(screen.getByText('Backend')).toBeInTheDocument();
    });

    it('closes on escape', () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');
        fireEvent.focus(input);
        expect(screen.getByRole('listbox')).toBeInTheDocument();

        fireEvent.keyDown(input, { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('creates tag on Enter if unique', async () => {
        render(<TagSelector initialTags={mockTags} />);
        const input = screen.getByPlaceholderText('tags.placeholder');

        fireEvent.change(input, { target: { value: 'UniqueTag' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        await waitFor(() => {
            expect(createTag).toHaveBeenCalledWith('UniqueTag');
        });
        expect(screen.getByText('UniqueTag')).toBeInTheDocument();
    });
});
