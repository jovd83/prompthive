import { test, expect } from '@playwright/test';
import { loginUser, promoteUserToAdmin } from './utils';

test.describe('Settings and Backup', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
        await promoteUserToAdmin(page);
    });

    test.skip('should configure auto-backup', async ({ page }) => {
        // ...
    });

    test.skip('should disable auto-backup', async ({ page }) => {
        await page.goto('/settings');
        const checkbox = page.locator('#autoBackup');

        // If it's already unchecked, check it first to test unchecking
        if (await checkbox.isChecked()) {
            await checkbox.click();
            await expect(page.getByLabel('Backup Directory Path')).toBeDisabled();
            await page.click('button:has-text("Save Backup Configuration")');
            await expect(page.locator('text=Settings saved successfully.')).toBeVisible();
        }
    });
});
