import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SortControls from './SortControls';

const pushMock = vi.fn();
const searchParamsMock = new URLSearchParams();

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        refresh: vi.fn(),
    }),
    useSearchParams: () => searchParamsMock,
    usePathname: () => '/',
}));

vi.mock('./LanguageProvider', () => ({
    useLanguage: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'list.views': 'Sort options',
                'list.sort.az': 'A - Z',
                'list.sort.za': 'Z - A',
                'list.sort.newest': 'Newest first',
                'list.sort.oldest': 'Oldest first'
            };
            return map[key] || key;
        }
    })
}));

describe('SortControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset search params
        Array.from(searchParamsMock.keys()).forEach(key => searchParamsMock.delete(key));
    });

    it('renders sort dropdown', () => {
        render(<SortControls />);
        const trigger = screen.getByTitle('Sort options');
        expect(trigger).toBeInTheDocument();

        fireEvent.click(trigger);

        expect(screen.getByText('A - Z')).toBeInTheDocument();
        expect(screen.getByText('Z - A')).toBeInTheDocument();
        expect(screen.getByText('Newest first')).toBeInTheDocument();
        expect(screen.getByText('Oldest first')).toBeInTheDocument();
    });

    it('handles sort change to A - Z', () => {
        render(<SortControls />);
        fireEvent.click(screen.getByTitle('Sort options'));
        fireEvent.click(screen.getByText('A - Z'));

        expect(pushMock).toHaveBeenCalledWith('/?sort=alpha&order=asc');
    });

    it('handles sort change to Z - A', () => {
        render(<SortControls />);
        fireEvent.click(screen.getByTitle('Sort options'));
        fireEvent.click(screen.getByText('Z - A'));

        expect(pushMock).toHaveBeenCalledWith('/?sort=alpha&order=desc');
    });

    it('handles sort change to Newest', () => {
        render(<SortControls />);
        fireEvent.click(screen.getByTitle('Sort options'));
        fireEvent.click(screen.getByText('Newest first'));

        expect(pushMock).toHaveBeenCalledWith('/?sort=date&order=desc');
    });
});
