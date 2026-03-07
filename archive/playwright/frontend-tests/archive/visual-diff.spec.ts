
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Visual Diff', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
        // Wait for session propagation reliability
        await page.waitForTimeout(1000);
    });

    test.fixme('should allow comparing two versions of a prompt', async ({ page }) => {
        // 1. Create a new prompt (Version 1)
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', 'Diff Test Prompt v1');
        await page.fill('textarea[name="description"]', 'Testing visual diff');

        // Type content into textarea (default view) - Use specific different words to ensure clean diff
        await page.fill('textarea[name="content"]', 'Line 1 is static.\nLine 2 is legacy.');

        await page.click('button:has-text("Create Prompt")');

        // Wait for navigation to detail page
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 30000 });

        // 2. Edit to create Version 2
        await page.click('a:has-text("Edit / New Version")');

        // Wait for navigation to Edit page
        await expect(page).toHaveURL(/\/edit$/, { timeout: 30000 });

        // Edit content in textarea
        await expect(page.locator('textarea[name="content"]')).toBeVisible();
        await page.fill('textarea[name="content"]', 'Line 1 is static.\nLine 2 is updated.\nLine 3 is new.');

        // Fill optional result text
        const resultBtn = page.locator('button:has-text("Results (Optional)")');
        if (await resultBtn.isVisible()) {
            await resultBtn.click();
        }
        await page.locator('textarea[name="resultText"]').fill('Updated result');

        // Fill changelog
        await page.fill('textarea[name="changelog"]', 'Updated content for diff test');

        // Wait for Save
        await page.click('button:has-text("Save New Version")');

        // Wait for Save loop to complete and navigation to detail page
        // Ensure we are NOT on the edit page anymore
        await expect(page).toHaveURL(/\/prompts\/[^\/]+$/, { timeout: 30000 });

        // 3. Verify we are back on detail page and have 2 versions
        await expect(page.locator('button:has-text("Version 2")')).toBeVisible();
        await expect(page.locator('div:has-text("Version 1")').first()).toBeVisible();

        // 4. Click the Compare button on Version 1
        const v1Row = page.locator('div.card').filter({ hasText: 'Version History' }).locator('div.flex').filter({ hasText: 'Version 1' });
        const v1Button = v1Row.locator('button[title*="Compare"]');

        // Ensure not covered by toast or tooltip
        await expect(v1Button).toBeVisible();
        await v1Button.click();

        // 5. Assert Modal is open
        await expect(page.getByText('Compare Versions')).toBeVisible();

        // 6. Assert diffs
        // "legacy" should be removed (red), "updated" should be added (green)
        // Using relaxed matching for background color classes used by diff viewer
        await expect(page.locator('.bg-red-100').filter({ hasText: 'legacy' }).first()).toBeVisible();
        await expect(page.locator('.bg-green-100').filter({ hasText: 'updated' }).first()).toBeVisible();

        // 7. Close modal
        await page.click('button[title="Close Comparison"]');
        await expect(page.getByText('Compare Versions')).not.toBeVisible();
    });
});
