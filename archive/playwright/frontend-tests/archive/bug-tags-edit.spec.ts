import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Bug Reproduction: Tags in Edit Mode', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should display previously assigned tags when editing a prompt', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Tag Bug Test ${timestamp}`;
        const tagName = `ReproTag${timestamp}`;

        // 1. Create a prompt with a tag
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Content');

        // Add Tag
        const tagInput = page.locator('input[placeholder="Select or create tags..."]');
        await tagInput.fill(tagName);
        await page.click(`text=Create tag "${tagName}"`);
        await expect(page.locator(`span:has-text("${tagName}")`)).toBeVisible();

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // 2. Go to Edit Page
        // Assuming we are on the detail page, click the edit button
        // Note: Locator might need adjustment based on actual UI, assuming there is an Edit button or link
        await page.click('a[href*="/edit"]');

        // 3. Verify Tag is Visible
        // The tag should be visible in the TagSelector component on the edit page
        await expect(page.locator(`span:has-text("${tagName}")`)).toBeVisible({ timeout: 5000 });
    });
});
