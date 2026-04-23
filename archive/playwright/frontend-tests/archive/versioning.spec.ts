
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.setTimeout(60000);

test.describe('Prompt Versioning & Restore', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should allow restoring an old version', async ({ page }) => {
        // 1. Create a prompt (v1)
        await page.goto('/prompts/new');
        const uniqueTitle = `Restore Test Prompt ${Date.now()}`;
        await page.fill('input[name="title"]', uniqueTitle);
        await page.locator('.cm-content').first().fill('Version 1 Content');
        await page.click('button[type="submit"]');

        // Wait for redirect to detail
        await expect(page).toHaveURL(/\/prompts\/\w+/);

        // 2. Edit to create v2
        await page.click('a[title="Edit"]');
        await page.locator('.cm-content').first().fill('Version 2 Content');
        await page.click('button[type="submit"]');

        // Verify v2 is showing
        await expect(page.locator('.cm-content')).toHaveText('Version 2 Content');
        await expect(page.getByText('Version 2')).toBeVisible();

        // 3. Open History and Restore v1
        // (Assuming history is visible or we need to expand/wait)
        const historySection = page.getByText('History', { exact: true });
        // History might be in a card, verify visibility
        await expect(historySection).toBeVisible();

        // Find v1 in history. It should be the second item (v2, v1)
        const v1Row = page.getByText('Version 1');
        await expect(v1Row).toBeVisible();

        // Hover or interact to see actions if needed (based on implementation, buttons are always visible in the row)
        // Find the restore button for v1.
        // We can locate by title="Restore this version" inside the row containing "Version 1"
        const restoreBtn = page.locator('button[title="Restore this version"]').last(); // Should be the one for v1 if v2 is top

        // Handle confirm dialog (Custom Modal)
        // page.on('dialog', dialog => dialog.accept()); // No longer native
        await restoreBtn.click();

        // Wait for modal and confirm
        await expect(page.locator('div[role="dialog"]')).toBeVisible();
        await page.click('button:has-text("Restore")');

        // Check for success message
        await expect(page.getByText('Version restored successfully')).toBeVisible();

        // 4. Verify v3 (Restored)
        // Should redirect or refresh.
        await expect(page.getByText('Version 3')).toBeVisible();
        await expect(page.locator('.cm-content')).toHaveText('Version 1 Content');

        // Verify Changelog says "Restored from version 1"
        await expect(page.getByText('Restored from version 1')).toBeVisible();
    });
});
