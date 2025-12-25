import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CopyToClipboard } from './CopyToClipboard';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(),
    },
});

describe('CopyToClipboard', () => {
    it('renders standard button with text by default', () => {
        render(<CopyToClipboard text="test" />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Copy');
        expect(button).toHaveClass('btn', 'gap-2');
    });

    it('renders icon-only button when variant="icon"', () => {
        render(<CopyToClipboard text="test" variant="icon" />);
        const button = screen.getByRole('button');
        expect(button).not.toHaveTextContent('Copy');
        // The component logic renders only the icon when variant="icon"
        expect(button.textContent).toBe('');
        expect(button).toHaveClass('btn-square');
    });

    it('copies text on click', () => {
        render(<CopyToClipboard text="copy me" />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
    });
});
