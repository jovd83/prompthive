import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers, updateUserRole, createUser, deleteUser, updateGlobalSettings } from './admin';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import * as UserService from '@/services/user';
import * as SettingsService from '@/services/settings';

// Mocks
vi.mock('next-auth');
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
        },
    }
}));
vi.mock('bcryptjs', () => ({
    hash: vi.fn(),
}));

vi.mock('@/services/user', () => ({
    createUserService: vi.fn(),
    getAllUsersService: vi.fn(),
    updateUserRoleService: vi.fn(),
    deleteUserService: vi.fn(),
}));

vi.mock('@/services/settings', () => ({
    updateGlobalSettingsService: vi.fn(),
}));

describe('Admin Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockAdminSession = { user: { id: 'admin-id', role: 'ADMIN' } };
    const mockUserSession = { user: { id: 'user-id', role: 'USER' } };

    describe('getUsers', () => {
        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(null);
            await expect(getUsers()).rejects.toThrow('Unauthorized');

            (getServerSession as any).mockResolvedValue(mockUserSession);
            await expect(getUsers()).rejects.toThrow('Unauthorized');
        });

        it('should call service if authorized', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await getUsers();
            expect(UserService.getAllUsersService).toHaveBeenCalled();
        });
    });

    describe('updateUserRole', () => {
        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(mockUserSession);
            await expect(updateUserRole('u1', 'ADMIN')).rejects.toThrow('Unauthorized');
        });

        it('should call service if valid', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await updateUserRole('u1', 'ADMIN');
            expect(UserService.updateUserRoleService).toHaveBeenCalledWith('u1', 'ADMIN');
        });
    });

    describe('createUser', () => {
        const userData = { username: 'u', email: 'e', password: 'p', role: 'USER' };

        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(mockUserSession);
            await expect(createUser(userData)).rejects.toThrow('Unauthorized: Admin access required');
        });

        it('should throw if fields missing', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await expect(createUser({ username: '' })).rejects.toThrow('Missing fields');
        });

        it('should throw if user exists', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            (prisma.user.findFirst as any).mockResolvedValue({ id: 'existing' });
            await expect(createUser(userData)).rejects.toThrow('User already exists');
        });

        it('should create user successfully', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            (prisma.user.findFirst as any).mockResolvedValue(null);
            (hash as any).mockResolvedValue('hashed_pwd');
            (UserService.createUserService as any).mockResolvedValue({ id: 'new' });

            await createUser(userData);

            expect(hash).toHaveBeenCalledWith('p', 10);
            expect(UserService.createUserService).toHaveBeenCalledWith({
                username: 'u',
                email: 'e',
                passwordHash: 'hashed_pwd',
                role: 'USER'
            });
        });
    });

    describe('deleteUser', () => {
        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(mockUserSession);
            await expect(deleteUser('u1')).rejects.toThrow('Unauthorized');
        });

        it('should throw if deleting self', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await expect(deleteUser('admin-id')).rejects.toThrow('You cannot delete your own account');
        });

        it('should call delete service if authorized', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await deleteUser('other-id');
            expect(UserService.deleteUserService).toHaveBeenCalledWith('other-id', 'admin-id');
        });
    });

    describe('updateGlobalSettings', () => {
        it('should throw if unauthorized', async () => {
            (getServerSession as any).mockResolvedValue(mockUserSession);
            await expect(updateGlobalSettings({ registrationEnabled: true })).rejects.toThrow('Unauthorized');
        });

        it('should call service if authorized', async () => {
            (getServerSession as any).mockResolvedValue(mockAdminSession);
            await updateGlobalSettings({ registrationEnabled: true });
            expect(SettingsService.updateGlobalSettingsService).toHaveBeenCalledWith({ registrationEnabled: true });
        });
    });
});
