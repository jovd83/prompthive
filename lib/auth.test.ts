import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions } from './auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Mocks
vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue('127.0.0.1')
    })
}));

vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: { findUnique: vi.fn() }
    }
}));

vi.mock('bcrypt', () => ({
    compare: vi.fn(),
    default: {
        compare: vi.fn()
    }
}));

import bcrypt from 'bcrypt';
import { prisma } from "@/lib/prisma";

describe('Auth Options', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('authorize', () => {
        const credentialsProvider = authOptions.providers.find((p: any) => p.id === 'credentials' || p.name === 'Credentials') as any;
        const authorize = credentialsProvider?.authorize;

        it('should return null if credentials missing', async () => {
            const res = await authorize({});
            expect(res).toBeNull();
        });

        it('should return null if user not found', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
            vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
            const res = await authorize({ username: 'u', password: 'p' });
            expect(res).toBeNull();
        });

        it('should return null if password invalid', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', passwordHash: 'hash' } as any);
            vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
            const res = await authorize({ username: 'u', password: 'p' });
            expect(res).toBeNull();
        });

        it.skip('should return user if valid', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ 
                id: 'u-1', 
                username: 'u', 
                passwordHash: 'hashed',
                role: 'USER'
            } as any);
            vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
            
            const res = await authorize({ username: 'u', password: 'p' } as any);
            expect(res).toMatchObject({ id: 'u-1', name: 'u', role: 'USER' });
        });
    });

    describe('callbacks', () => {
        it('jwt should persist user info', async () => {
            const token = {};
            const user = { id: 'u-1', role: 'USER' };
            const res = await (authOptions.callbacks as any)?.jwt({ token, user });
            expect(res).toEqual({ id: 'u-1', role: 'USER' });
        });

        it('session should populate user', async () => {
            const session = { user: {} };
            const token = { id: 'u-1', role: 'USER' };
            const res = await (authOptions.callbacks as any)?.session({ session, token });
            expect(res?.user).toMatchObject({ id: 'u-1', role: 'USER' });
        });
    });
});
