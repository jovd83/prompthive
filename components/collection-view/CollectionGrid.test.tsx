// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CollectionGrid from './CollectionGrid';

// Mock PromptCard to inspect props
vi.mock('@/components/PromptCard', () => ({
    default: (props: any) => (
        <div data-testid="prompt-card" data-tag-colors-enabled={String(props.tagColorsEnabled)}>
            PromptCard: {props.prompt.title}
        </div>
    )
}));

describe('CollectionGrid Tag Colors Bug', () => {
    const mockCollection = {
        id: 'col1',
        title: 'Test Collection',
        description: 'Test Description',
        ownerId: 'user1',
        children: [],
        prompts: [
            {
                id: 'p1',
                title: 'Test Prompt 1',
                tags: []
            }
        ],
        _count: { prompts: 1 }
    };

    it('passes tagColorsEnabled=false to PromptCard when disabled', () => {
        render(<CollectionGrid collection={mockCollection} tagColorsEnabled={false} />);

        const card = screen.getByTestId('prompt-card');
        // If bug exists, prop is undefined -> "undefined". If fixed -> "false".
        expect(card).toHaveAttribute('data-tag-colors-enabled', 'false');
    });
});
