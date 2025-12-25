import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Internationalization (i18n)', () => {

    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should switch language and persist setting', async ({ page }) => {
        // 1. Navigate to Settings
        await page.goto('/settings');
        // Verify General Settings is there
        await expect(page.getByRole('heading', { name: 'General Settings' })).toBeVisible();
        // Verify Language Settings is there
        await expect(page.getByRole('heading', { name: 'Language Settings' })).toBeVisible();

        // 2. Verify current language (English default)
        const select = page.locator('select');
        await expect(select).toHaveValue('en');

        // 3. Change to French
        await select.selectOption('fr');

        // 4. Verify UI update immediately
        // Sidebar link "Dashboard" should become "Tableau de Bord"
        await expect(page.getByRole('link', { name: 'Tableau de Bord', exact: true })).toBeVisible();

        // 5. Reload page to test persistence
        await page.reload();
        // Wait for hydration
        await expect(page.getByRole('link', { name: 'Tableau de Bord', exact: true })).toBeVisible();

        // 6. Cleanup: Revert to English
        await select.selectOption('en');
        await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
    });

    test('should NOT show language selector in User Profile', async ({ page }) => {
        const profileButton = page.locator('button[data-testid="user-profile-trigger"]');
        await profileButton.click();
        const prefTab = page.getByTestId('tab-preferences');

        // If preferences tab still exists (for admin/other stuff), click it
        if (await prefTab.isVisible()) {
            await prefTab.click();
            const content = page.getByTestId('content-preferences');
            await expect(content).toBeVisible();
            await expect(content.locator('select')).not.toBeVisible();
        }
        // If preferences tab is gone, that's also fine, but here we expect it might be there for Admin

    });
});
