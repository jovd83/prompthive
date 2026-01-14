
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from './UserManagement';
import { ROLES } from '@/lib/permissions';
import { updateUserRole } from '@/actions/admin';
import { vi, describe, it, expect } from 'vitest';

// Mock the server action
vi.mock('@/actions/admin', () => ({
    updateUserRole: vi.fn().mockResolvedValue({ success: true }),
    getUsers: vi.fn(),
    createUser: vi.fn(),
    deleteUser: vi.fn(),
}));

// Mock LanguageProvider
vi.mock('../LanguageProvider', () => ({
    useLanguage: () => ({ t: (key: string) => key }),
}));

// Mock ConfirmationDialog
vi.mock('../ConfirmationDialog', () => ({
    default: () => null,
}));

describe('UserManagement', () => {
    const mockUsers = [
        {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            role: ROLES.USER,
            avatarUrl: null,
            createdAt: new Date(),
        },
    ];

    it('updates user role when select is changed', async () => {
        render(<UserManagement initialUsers={mockUsers} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: ROLES.ADMIN } });

        await waitFor(() => {
            expect(updateUserRole).toHaveBeenCalledWith('1', ROLES.ADMIN);
        });
    });
});
