import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TipOfTheDay from './TipOfTheDay';

// Mock the tips data
vi.mock('@/prompting_tips/prompt_tips.json', () => ({
    default: [
        {
            "title": "Test Tip",
            "short": "Short description",
            "long": "Long description text that is hidden by default.",
            "resource_text": "Resource Link",
            "resource_url": "https://example.com"
        }
    ]
}));

// Mock useLanguage
vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'common.tipOfTheDay': 'Tip of the Day',
                'common.expandTip': 'Expand tip',
                'common.collapseTip': 'Collapse tip',
                'common.learnMore': 'Learn more'
            };
            return map[key] || key;
        }
    })
}));

describe('TipOfTheDay', () => {
    it('renders the tip title and short description initially', () => {
        render(<TipOfTheDay />);
        expect(screen.getByText('Test Tip')).toBeDefined();
        expect(screen.getByText('Short description')).toBeDefined();
        // Long description should not be visible yet
        expect(screen.queryByText('Long description text that is hidden by default.')).toBeNull();
    });

    it('expands to show long description and resource when clicked', () => {
        render(<TipOfTheDay />);
        const toggleButton = screen.getByLabelText('Expand tip');

        fireEvent.click(toggleButton);

        expect(screen.getByText('Long description text that is hidden by default.')).toBeDefined();
        expect(screen.getByText('Resource Link')).toBeDefined();
    });

    it('collapses when clicked again', () => {
        render(<TipOfTheDay />);
        const toggleButton = screen.getByLabelText('Expand tip');

        // Expand
        fireEvent.click(toggleButton);
        expect(screen.getByText('Long description text that is hidden by default.')).toBeDefined();

        // Collapse
        const collapseButton = screen.getByLabelText('Collapse tip');
        fireEvent.click(collapseButton);

        // Wait for removal or check immediate null
        expect(screen.queryByText('Long description text that is hidden by default.')).toBeNull();
    });
});
