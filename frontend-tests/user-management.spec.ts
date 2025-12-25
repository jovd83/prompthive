import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('User Management', () => {

    test('should allow requesting password reset', async ({ page }) => {
        await page.goto('/login');
        await page.click('text=Forgot password?');
        await expect(page).toHaveURL('/forgot-password');

        await page.fill('input[name="email"]', 'test@example.com');
        await page.click('button:has-text("Send Reset Link")');

        await expect(page.getByText('If an account exists, a reset link has been sent.')).toBeVisible();
    });

    test('should allow navigating to user profile and switching tabs', async ({ page }) => {
        await loginUser(page);

        // Wait for sidebar to load and user profile button to appear
        const profileButton = page.locator('button[data-testid="user-profile-trigger"]');
        await expect(profileButton).toBeVisible();

        await profileButton.click();

        // Check Dialog
        const dialog = page.locator('h2:has-text("User Profile")');
        await expect(dialog).toBeVisible();

        // Check Logout Button presence
        // Wait explicitly for animation
        await page.waitForTimeout(1000);
        await expect(page.locator('button', { hasText: 'Sign Out' })).toBeVisible({ timeout: 10000 });

        // Wait for animation
        await page.waitForTimeout(500);

        // Check Tabs
        await expect(page.getByTestId('tab-avatar')).toBeVisible();
        await expect(page.getByTestId('tab-security')).toBeVisible();
        await expect(page.getByTestId('content-avatar')).toBeVisible();

        // Switch to Security
        await page.getByTestId('tab-security').click();

        // Wait for switch
        await expect(page.getByTestId('content-security')).toBeVisible();
        await expect(page.getByText('Current Password')).toBeVisible();

        // Attempt change with wrong password
        await page.fill('input[name="currentPassword"]', 'wrongpass');
        await page.fill('input[name="newPassword"]', 'newpass123');
        await page.locator('[data-testid="content-security"] button[type="submit"]').click();

        await expect(page.getByText('Incorrect current password')).toBeVisible();
    });
});
