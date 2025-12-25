
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Enhanced Prompt Card', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    // Test card visibility and elements
    test('should display detailed card with content preview and copy button', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Card Test ${timestamp}`;
        const promptContent = 'Card preview content';

        // Create prompt
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', promptContent);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/);

        // Go to dashboard
        await page.goto('/');

        // Find the card by title
        // Find the card by title and wait for it
        const card = page.locator('.card', { hasText: promptTitle }).first();
        await card.waitFor({ state: 'visible', timeout: 10000 });
        await expect(card).toBeVisible();

        // Check for content preview
        await expect(card.locator('pre')).toContainText(promptContent);

        // Check for Copy Button and functionality
        // Button should now be visible without hover
        const codeBlock = card.locator('.group\\/code');
        const copyBtn = codeBlock.locator('button', { hasText: 'Copy' });
        await expect(copyBtn).toBeVisible();

        await copyBtn.click();

        await expect(codeBlock.locator('text=Copied')).toBeVisible();

        // Check for Meta: Updated time (approx), View, Copies
        await expect(card.locator('text=By')).toBeVisible();
        await expect(card.locator('text=Updated')).toBeVisible();
    });

    test.skip('should display result image thumbnail if present', async ({ page }) => {
        const promptTitle = `Image Card ${Date.now()}`;

        // Create prompt with attachment that is a result
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Img content');

        // File upload skipped per request
        // await page.click('button[type="submit"]');

        // ...
    });
});
