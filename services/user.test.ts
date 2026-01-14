
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAvatarService, changePasswordService, generateResetTokenService, resetPasswordService, updateLanguageService, updateUserRoleService, createUserService } from './user';
import { prisma } from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            update: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        }
    }
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
    hash: vi.fn(),
    compare: vi.fn(),
}));

describe('User Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateAvatarService', () => {
        it('should update avatar url', async () => {
            await updateAvatarService(userId, '/new-avatar.png');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { avatarUrl: '/new-avatar.png' }
            });
        });
    });

    describe('changePasswordService', () => {
        it('should change password if old password matches', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, passwordHash: 'hashed-old' });
            (compare as any).mockResolvedValue(true);
            (hash as any).mockResolvedValue('hashed-new');

            await changePasswordService(userId, 'old', 'new');

            expect(compare).toHaveBeenCalledWith('old', 'hashed-old');
            expect(hash).toHaveBeenCalledWith('new', 12);
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { passwordHash: 'hashed-new' }
            });
        });

        it('should throw if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            await expect(changePasswordService(userId, 'old', 'new')).rejects.toThrow('User not found');
        });

        it('should throw if old password incorrect', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ id: userId, passwordHash: 'hashed-old' });
            (compare as any).mockResolvedValue(false);

            await expect(changePasswordService(userId, 'bad-old', 'new')).rejects.toThrow('Incorrect current password');
        });
    });

    describe('generateResetTokenService', () => {
        it('should generate token if user exists', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({ email: 'test@example.com' });

            const token = await generateResetTokenService('test@example.com');

            expect(token).toBeDefined();
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                data: expect.objectContaining({
                    resetToken: expect.any(String),
                    resetTokenExpires: expect.any(Date)
                })
            });
        });

        it('should return null if user not found', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            const token = await generateResetTokenService('missing@example.com');
            expect(token).toBeNull();
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('resetPasswordService', () => {
        it('should reset password with valid token', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({
                id: userId,
                resetToken: 'valid-token',
                resetTokenExpires: new Date(Date.now() + 10000)
            });
            (hash as any).mockResolvedValue('new-hash');

            await resetPasswordService('valid-token', 'new-pass');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: expect.objectContaining({
                    passwordHash: 'new-hash',
                    resetToken: null,
                    resetTokenExpires: null
                })
            });
        });

        it('should throw if token invalid or expired', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);
            await expect(resetPasswordService('bad-token', 'pass')).rejects.toThrow('Invalid or expired reset token');
        });
    });
    describe('updateLanguageService', () => {
        it('should update language for valid input', async () => {
            await updateLanguageService(userId, 'nl');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { language: 'nl' }
            });
        });

        it('should throw for invalid language', async () => {
            await expect(updateLanguageService(userId, 'de')).rejects.toThrow('Invalid language');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });

    describe('updateUserRoleService', () => {
        it('should update role for valid input', async () => {
            await updateUserRoleService(userId, 'ADMIN');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { role: 'ADMIN' }
            });
        });

        it('should update role to GUEST for valid input', async () => {
            await updateUserRoleService(userId, 'GUEST');
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: { role: 'GUEST' }
            });
        });

        it('should throw for invalid role', async () => {
            await expect(updateUserRoleService(userId, 'SUPERUSER')).rejects.toThrow('Invalid role');
            expect(prisma.user.update).not.toHaveBeenCalled();
        });
    });
});

describe('createUserService', () => {
    it('should create a new user with GUEST role', async () => {
        (hash as any).mockResolvedValue('hashed-password');
        (prisma.user.findFirst as any).mockResolvedValue(null);

        await createUserService({
            username: 'guestuser',
            email: 'guest@example.com',
            passwordHash: 'hashed-password',
            role: 'GUEST'
        });


        expect(prisma.user.create).toHaveBeenCalledWith({
            data: {
                username: 'guestuser',
                email: 'guest@example.com',
                passwordHash: 'hashed-password',
                role: 'GUEST'
            }
        });
    });

    it('should throw if user already exists', async () => {
        (prisma.user.findFirst as any).mockResolvedValue({ id: 'existing-id' });

        await expect(createUserService({
            username: 'existing',
            email: 'exist@example.com',
            passwordHash: 'pass',
            role: 'USER'
        })).rejects.toThrow('User with this email or username already exists');
    });
});

