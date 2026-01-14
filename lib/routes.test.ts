import { describe, it, expect } from 'vitest';
import { Routes, AuthCallbackUrls } from './routes';

describe('Routes Constants', () => {
    it('should have correct route paths', () => {
        expect(Routes.HOME).toBe('/');
        expect(Routes.LOGIN).toBe('/login');
        expect(Routes.SIGNOUT).toBe('/api/auth/signout');
        expect(Routes.COLLECTIONS).toBe('/collections');
        expect(Routes.PROMPTS).toBe('/prompts');
    });

    it('should have correct callback urls', () => {
        expect(AuthCallbackUrls.LOGIN_CALLBACK).toBe('/api/auth/signout?callbackUrl=/login');
    });
});
