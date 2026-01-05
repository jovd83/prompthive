import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Bug Reproduction: Description Cleared on Tag Add', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should NOT clear description when adding a tag in edit mode', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Bug Repro Prompt ${timestamp}`;
        const promptContent = 'Simple content';

        // 1. Create a prompt first
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', promptContent);
        await page.click('button[type="submit"]');

        // Wait for redirection to details page
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // Get the ID from the URL
        const url = page.url();
        const promptId = url.split('/').pop();

        // 2. Go to Edit Page
        await page.goto(`/prompts/${promptId}/edit`);

        // 3. Fill in Description
        const testDescription = "This is a test description that should persist.";
        const descriptionInput = page.locator('textarea[name="description"]');
        await descriptionInput.fill(testDescription);

        // ensure value is set
        await expect(descriptionInput).toHaveValue(testDescription);

        // 4. Add a Tag
        const tagName = `Tag${timestamp}`;
        const tagInput = page.locator('input[placeholder="Search or create tags..."]');
        // Note: TagSelector placeholder might change, falling back to robust locator if needed.
        // In TagSelector.tsx: placeholder={t('tags.placeholder') || "Search or create tags..."}

        await expect(tagInput).toBeVisible();
        await tagInput.fill(tagName);

        // Wait for create option
        // The Create option is usually: 'Create "tagName"'
        await page.click(`text=Create "${tagName}"`);

        // 5. Verify Tag Added
        await expect(page.locator(`span:has-text("${tagName}")`)).toBeVisible();

        // 6. Verify Description Persists
        // This is where it fails if the bug exists
        await expect(descriptionInput).toHaveValue(testDescription);
    });
});
