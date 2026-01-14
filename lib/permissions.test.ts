
import { describe, it, expect } from 'vitest';
import { hasPermission, isGuest, isAdmin, canEditPrompt, ROLES, Action } from './permissions';

describe('Permissions', () => {
    describe('hasPermission', () => {
        const adminUser = { id: '1', role: ROLES.ADMIN };
        const regularUser = { id: '2', role: ROLES.USER };
        const guestUser = { id: '3', role: ROLES.GUEST };

        it('should allow ADMIN all actions', () => {
            expect(hasPermission(adminUser, 'create:prompt')).toBe(true);
            expect(hasPermission(adminUser, 'manage:users')).toBe(true);
            expect(hasPermission(adminUser, 'delete:collection')).toBe(true);
        });

        it('should allow USER specific actions', () => {
            expect(hasPermission(regularUser, 'create:prompt')).toBe(true);
            expect(hasPermission(regularUser, 'edit:prompt')).toBe(true);
            expect(hasPermission(regularUser, 'import')).toBe(true);
        });

        it('should deny USER admin actions', () => {
            expect(hasPermission(regularUser, 'manage:users')).toBe(false);
            expect(hasPermission(regularUser, 'view:admin')).toBe(false);
        });

        it('should deny GUEST mutation actions', () => {
            expect(hasPermission(guestUser, 'create:prompt')).toBe(false);
            expect(hasPermission(guestUser, 'edit:prompt')).toBe(false);
        });

        it('should handle null/undefined user', () => {
            expect(hasPermission(null, 'create:prompt')).toBe(false);
            expect(hasPermission(undefined, 'create:prompt')).toBe(false);
        });
    });

    describe('Helpers', () => {
        it('isGuest should return true only for guest role', () => {
            expect(isGuest({ role: ROLES.GUEST })).toBe(true);
            expect(isGuest({ role: ROLES.USER })).toBe(false);
            expect(isGuest(null)).toBe(false);
        });

        it('isAdmin should return true only for admin role', () => {
            expect(isAdmin({ role: ROLES.ADMIN })).toBe(true);
            expect(isAdmin({ role: ROLES.USER })).toBe(false);
            expect(isAdmin(null)).toBe(false);
        });
    });

    describe('canEditPrompt', () => {
        const admin = { id: 'admin', role: ROLES.ADMIN };
        const user1 = { id: 'u1', role: ROLES.USER };
        const user2 = { id: 'u2', role: ROLES.USER };

        const promptOwnedByU1 = { createdById: 'u1', isLocked: false };
        const promptLockedU1 = { createdById: 'u1', isLocked: true };

        it('should allow admin to edit any prompt', () => {
            expect(canEditPrompt(admin, promptOwnedByU1)).toBe(true);
            expect(canEditPrompt(admin, promptLockedU1)).toBe(true);
        });

        it('should allow owner to edit their own unlocked prompt', () => {
            expect(canEditPrompt(user1, promptOwnedByU1)).toBe(true);
        });

        it('should deny non-owner from editing', () => {
            expect(canEditPrompt(user2, promptOwnedByU1)).toBe(false);
        });

        it('should deny owner if prompt is locked', () => {
            expect(canEditPrompt(user1, promptLockedU1)).toBe(false);
        });

        it('should return false for null user', () => {
            expect(canEditPrompt(null, promptOwnedByU1)).toBe(false);
        });
    });
});
