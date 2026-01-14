import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import * as UserActions from './user';
import { getServerSession } from 'next-auth';
import * as UserService from '@/services/user';
import * as FileService from '@/services/files';
import * as EmailService from '@/services/email';
// fs imported later for integration

// Mocks
// Mocks
vi.mock('next-auth');
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn(() => ({ get: () => 'http://localhost' })) }));
vi.mock('@/services/user', () => ({
    updateAvatarService: vi.fn(),
    changePasswordService: vi.fn(),
    generateResetTokenService: vi.fn(),
    resetPasswordService: vi.fn(),
    updateLanguageService: vi.fn(),
    updateUserRoleService: vi.fn(),
}));
vi.mock('@/services/files', () => ({
    uploadFile: vi.fn(),
}));
vi.mock('@/services/email', () => ({
    sendPasswordResetEmail: vi.fn(),
}));

// Real fs for integration testing of promoteToAdmin since mock failed
import fs from 'fs';
import path from 'path';

const ADMIN_PROP_PATH = path.join(process.cwd(), 'admin.properties');
const BAK_PATH = path.join(process.cwd(), 'admin.properties.bak');

describe('User Actions', () => {
    const userId = 'u-1';
    const mockSession = { user: { id: userId, role: 'USER' } };

    beforeAll(() => {
        if (fs.existsSync(ADMIN_PROP_PATH)) {
            fs.renameSync(ADMIN_PROP_PATH, BAK_PATH);
        }
    });

    afterAll(() => {
        if (fs.existsSync(ADMIN_PROP_PATH)) fs.unlinkSync(ADMIN_PROP_PATH);
        if (fs.existsSync(BAK_PATH)) {
            fs.renameSync(BAK_PATH, ADMIN_PROP_PATH);
        }
    });

    beforeEach(() => {
        vi.resetAllMocks();
        (getServerSession as any).mockResolvedValue(mockSession);
        // Ensure clean state
        if (fs.existsSync(ADMIN_PROP_PATH)) fs.unlinkSync(ADMIN_PROP_PATH);
    });

    describe('updateAvatar', () => {
        it('should upload and update', async () => {
            const fd = new FormData();
            fd.append('avatar', new Blob(['img']), 'test.png');

            (FileService.uploadFile as any).mockResolvedValue({ filePath: '/av.png' });

            const res = await UserActions.updateAvatar(fd);
            expect(res.success).toBe('Avatar updated successfully');
            expect(FileService.uploadFile).toHaveBeenCalled();
            expect(UserService.updateAvatarService).toHaveBeenCalledWith(userId, '/av.png');
        });
    });

    describe('changePassword', () => {
        it('should call service', async () => {
            const fd = new FormData();
            fd.append('currentPassword', 'old');
            fd.append('newPassword', 'new');

            (UserService.changePasswordService as any).mockResolvedValue(true);
            const res = await UserActions.changePassword({}, fd);
            expect(res.success).toEqual('Password updated successfully');
            expect(UserService.changePasswordService).toHaveBeenCalledWith(userId, 'old', 'new');
        });
    });

    describe('requestPasswordReset', () => {
        it('should send email if token generated', async () => {
            const fd = new FormData();
            fd.append('email', 'test@test.com');
            (UserService.generateResetTokenService as any).mockResolvedValue('tok-123');

            const res = await UserActions.requestPasswordReset({}, fd);
            expect(res.success).toBeDefined();
            expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith('test@test.com', 'tok-123', expect.any(String));
        });
    });

    describe('updateLanguage', () => {
        it('should call service', async () => {
            const fd = new FormData();
            fd.append('language', 'es');
            await UserActions.updateLanguage({}, fd);
            expect(UserService.updateLanguageService).toHaveBeenCalledWith(userId, 'es');
        });
    });

    describe('resetPassword', () => {
        it('should call service', async () => {
            const fd = new FormData();
            fd.append('token', 'tok');
            fd.append('newPassword', 'new');

            await UserActions.resetPassword({}, fd);
            expect(UserService.resetPasswordService).toHaveBeenCalledWith('tok', 'new');
        });
    });

    describe('promoteToAdmin', () => {
        it('should fail if file missing', async () => {
            // Already ensured missing in beforeEach
            const fd = new FormData();
            fd.append('code', '123456');

            const res = await UserActions.promoteToAdmin({}, fd);
            expect(res.error).toContain('Configuration file missing');
        });

        it('should promote if code matches', async () => {
            fs.writeFileSync(ADMIN_PROP_PATH, 'admin.code=123456');
            console.log('Test: Written file');

            const fd = new FormData();
            fd.append('code', '123456');

            const res = await UserActions.promoteToAdmin({}, fd);
            expect(res.success).toBeDefined();
            expect(UserService.updateUserRoleService).toHaveBeenCalledWith(userId, 'ADMIN');
        });

        it('should fail if code mismatch', async () => {
            fs.writeFileSync(ADMIN_PROP_PATH, 'admin.code=123456');

            const fd = new FormData();
            fd.append('code', '000000');

            const res = await UserActions.promoteToAdmin({}, fd);
            expect(res.error).toContain('Incorrect code');
        });
    });
});
