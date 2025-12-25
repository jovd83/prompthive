
import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendWelcomeEmail, sendPasswordResetEmail } from './email';
import { promises as fs } from 'fs';
import path from 'path';

// Mock fs.mkdir and fs.appendFile
vi.mock('fs', async () => {
    const mkDirFn = vi.fn();
    const appendFileFn = vi.fn();
    return {
        promises: {
            mkdir: mkDirFn,
            appendFile: appendFileFn,
        },
        default: {
            promises: {
                mkdir: mkDirFn,
                appendFile: appendFileFn,
            }
        }
    };
});

describe('sendWelcomeEmail', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should log the welcome email to a file', async () => {
        const email = 'test@example.com';
        await sendWelcomeEmail(email);

        expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
        expect(fs.appendFile).toHaveBeenCalledWith(
            expect.stringContaining('email.log'),
            expect.stringContaining(`To: ${email}`)
        );
        expect(fs.appendFile).toHaveBeenCalledWith(
            expect.stringContaining('email.log'),
            expect.stringContaining('Welcome to PromptHive!')
        );
    });

    it('should log the password reset email to a file', async () => {
        const email = 'reset@example.com';
        const token = 'abc-123';
        const origin = 'http://localhost:3000';
        await sendPasswordResetEmail(email, token, origin);

        expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
        expect(fs.appendFile).toHaveBeenCalledWith(
            expect.stringContaining('email.log'),
            expect.stringContaining(`To: ${email}`)
        );
        expect(fs.appendFile).toHaveBeenCalledWith(
            expect.stringContaining('email.log'),
            expect.stringContaining('Link: http://localhost:3000/reset-password?token=abc-123')
        );
    });
});
