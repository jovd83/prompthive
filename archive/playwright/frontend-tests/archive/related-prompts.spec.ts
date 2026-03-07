
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Linked Prompts Feature', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should allow linking and unlinking prompts bidirectionally', async ({ page }) => {
        // 1. Create two prompts
        const promptATitle = `Prompt A ${Date.now()}`;
        const promptBTitle = `Prompt B ${Date.now()}`;

        // Create Prompt A
        await page.goto('/');
        await page.click('text=New Prompt');
        await page.fill('input[name="title"]', promptATitle);
        await page.fill('textarea[name="content"]', 'Content A');
        await page.click('button:has-text("Create Prompt")');
        await expect(page.locator('h1').filter({ hasText: promptATitle })).toBeVisible();
        const promptAUrl = page.url();

        // Create Prompt B
        await page.goto('/');
        await page.click('text=New Prompt');
        await page.fill('input[name="title"]', promptBTitle);
        await page.fill('textarea[name="content"]', 'Content B');
        await page.click('button:has-text("Create Prompt")');
        await expect(page.locator('h1').filter({ hasText: promptBTitle })).toBeVisible();
        const promptBUrl = page.url();

        // 2. Link Prompt B to Prompt A (from A's page)
        await page.goto(promptAUrl);

        // Open Link Modal
        await page.click('button[title="Link Related Prompt"]');
        await expect(page.locator('text=Link Related Prompt')).toBeVisible();

        // Search for Prompt B
        await page.fill('input[placeholder*="Search"]', promptBTitle.substring(0, 8)); // Type "Prompt B" (approx)

        // Wait for Loading to appear and disappear or just wait for result
        await expect(page.locator(`text=${promptBTitle}`)).toBeVisible({ timeout: 10000 });

        // Click Link
        await page.locator(`div:has-text("${promptBTitle}")`).locator('button:has-text("Link")').click();

        // Wait for modal to close (indicates success)
        await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
        await expect(page.locator('text=Link Related Prompt')).not.toBeVisible();

        // Wait for re-fetch/reload
        await page.reload();

        // 3. Verify Link on Prompt A
        await expect(page.locator('text=Related Prompts')).toBeVisible();
        await expect(page.locator(`.card.group:has-text("${promptBTitle}")`)).toBeVisible();

        // 4. Verify Link on Prompt B (Bidirectional)
        await page.goto(promptBUrl);
        await expect(page.locator('text=Related Prompts')).toBeVisible();
        await expect(page.locator(`.card.group:has-text("${promptATitle}")`)).toBeVisible();

        // 5. Unlink Prompt A from Prompt B
        // Hover over the wrapper to reveal the unlink button (siblings)
        const wrapper = page.locator('.relative.group:has(.card)').filter({ hasText: promptATitle });
        await wrapper.hover(); // Optional but helps with flake

        // Accept dialog
        page.once('dialog', dialog => dialog.accept());
        await page.locator('button[title="Unlink Prompt"]').first().click({ force: true });

        // 6. Verify Unlink
        await expect(wrapper).not.toBeVisible();
        await expect(page.locator('text=Related Prompts')).not.toBeVisible();

        // Verify removed from A as well
        await page.goto(promptAUrl);
        await expect(page.locator(`.card.group:has-text("${promptBTitle}")`)).not.toBeVisible();
    });
});
