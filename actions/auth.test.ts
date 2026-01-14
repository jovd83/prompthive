import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUser } from './auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sendWelcomeEmail } from '@/services/email';

// Mocks
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
        globalConfiguration: {
            findUnique: vi.fn(),
        },
    }
}));

vi.mock('bcryptjs', () => ({
    hash: vi.fn(),
}));

vi.mock('@/services/email', () => ({
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

describe('Auth Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('registerUser', () => {
        it('should throw error if fields are missing', async () => {
            await expect(registerUser('', 'email', 'pass')).rejects.toThrow('Missing required fields');
            await expect(registerUser('user', '', 'pass')).rejects.toThrow('Missing required fields');
            await expect(registerUser('user', 'email', '')).rejects.toThrow('Missing required fields');
        });

        it('should throw if email already exists', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({ email: 'test@example.com' });

            await expect(registerUser('newuser', 'test@example.com', 'pass'))
                .rejects.toThrow('Email already registered');
        });

        it('should throw if username already exists', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({ username: 'existinguser' });

            await expect(registerUser('existinguser', 'new@example.com', 'pass'))
                .rejects.toThrow('Username already taken');
        });

        it('should throw if registration is disabled', async () => {
            (prisma.user.findFirst as any).mockResolvedValue(null);
            (prisma.globalConfiguration.findUnique as any).mockResolvedValue({ registrationEnabled: false });

            await expect(registerUser('user', 'email@example.com', 'pass'))
                .rejects.toThrow('Registration is currently disabled');
        });

        it('should register user successfully', async () => {
            (prisma.user.findFirst as any).mockResolvedValue(null);
            (prisma.globalConfiguration.findUnique as any).mockResolvedValue({ registrationEnabled: true });
            (hash as any).mockResolvedValue('hashed_password');
            (prisma.user.create as any).mockResolvedValue({ id: 'u1', email: 'test@example.com' });

            await registerUser('user', 'test@example.com', 'password123');

            expect(hash).toHaveBeenCalledWith('password123', 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    username: 'user',
                    email: 'test@example.com',
                    passwordHash: 'hashed_password',
                    role: 'USER'
                }
            });
            expect(sendWelcomeEmail).toHaveBeenCalledWith('test@example.com');
        });

        it('should proceed if global config is missing (default behavior assumption)', async () => {
            // Assuming if config is null, registration is allowed (standard fallback, or it might throw? 
            // Looking at code: `if (globalSettings && !globalSettings.registrationEnabled)` -> checks only if it exists and is explicitly false.
            // So null means enabled.
            (prisma.user.findFirst as any).mockResolvedValue(null);
            (prisma.globalConfiguration.findUnique as any).mockResolvedValue(null);
            (hash as any).mockResolvedValue('hashed');

            await registerUser('user', 'email', 'pass');

            expect(prisma.user.create).toHaveBeenCalled();
        });
    });
});
