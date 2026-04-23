import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.setTimeout(60000);

test.describe('Prompting Tip of the Day', () => {
    test.beforeEach(async ({ page }) => {
        // Assume user is logged in or we mock session. 
        // For local dev with no auth setup in tests, we rely on the test environment configuration.
        // If auth is required, we might need a setup step. 
        // Assuming we can visit '/' and if redirected to login, we login.

        await page.goto('/');

        // Handling potential login redirect
        if (page.url().includes('login')) {
            await page.fill('input[name="email"]', 'admin@example.com');
            await page.fill('input[name="password"]', 'admin123'); // Default dev credentials
            await page.click('button[type="submit"]');
            await page.waitForURL('/');
        }
    });

    test('should display Tip of the Day on dashboard by default', async ({ page }) => {
        // Verify Tip container exists
        const tipContainer = page.locator('.bg-blue-50');
        // Or better selector if we added data-testid, but class is specific enough for now in this context
        await expect(tipContainer).toBeVisible();

        // Verify Content
        await expect(page.locator('text=Tip of the Day')).toBeVisible();
        await expect(page.locator('button[aria-label="Expand tip"]')).toBeVisible();
    });

    test('should expand and collapse tip', async ({ page }) => {
        const expandButton = page.locator('button[aria-label="Expand tip"]');
        await expandButton.click();

        // Verify long text is visible (checking for existence of expanded content container specific styling or element)
        // We look for the collapse button which indicates state change
        const collapseButton = page.locator('button[aria-label="Collapse tip"]');
        await expect(collapseButton).toBeVisible();

        // Click collapse
        await collapseButton.click();
        await expect(expandButton).toBeVisible();
    });

    test('should allow disabling tips in settings', async ({ page }) => {
        // Go to Settings
        await page.goto('/settings');

        // Find toggle
        const toggle = page.locator('input[type="checkbox"]').first(); // Might need more specific selector
        // We added a "General Settings" section
        const tipsToggle = page.getByRole('checkbox', { name: /Show Prompting Tips/i }).first();

        // Ensure it is checked (default)
        if (!await tipsToggle.isChecked()) {
            await tipsToggle.check();
            await page.click('button:has-text("Save Settings")');
            await expect(page.locator('text=Settings saved successfully')).toBeVisible();
        }

        // Uncheck
        await tipsToggle.uncheck();
        await page.click('button:has-text("Save Settings")');
        await expect(page.locator('text=Settings saved successfully')).toBeVisible();

        // Go back to Dashboard
        await page.goto('/');

        // Verify Tip is GONE
        const tipContainer = page.locator('.bg-blue-50');
        await expect(tipContainer).not.toBeVisible();

        // Cleanup: Turn it back on
        await page.goto('/settings');
        await tipsToggle.check();
        await page.click('button:has-text("Save Settings")');
    });
});
