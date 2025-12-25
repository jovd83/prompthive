
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Collection Grid View', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should display grid of cards when collection is selected', async ({ page }) => {
        const collectionTitle = `Grid Collection ${Date.now()}`;
        const promptTitle1 = `Grid Prompt 1 ${Date.now()}`;
        const promptTitle2 = `Grid Prompt 2 ${Date.now()}`;

        // 1. Create Collection
        await test.step('Create Collection', async () => {
            await page.click('a[title="New Collection"]');
            await page.fill('input[name="title"]', collectionTitle);
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/\/collections/);
            await page.waitForTimeout(1000); // Wait for sidebar refresh
        });

        // 2. Create Prompts in that Collection
        await test.step('Create Prompts', async () => {
            // Prompt 1
            await page.goto('/prompts/new');
            await page.fill('input[name="title"]', promptTitle1);
            await page.fill('textarea[name="content"]', 'Test content 1');

            // Select collection
            await page.locator('select[name="collectionId"]').click();
            const option1 = page.locator('select[name="collectionId"] option').filter({ hasText: collectionTitle }).first();
            const val1 = await option1.getAttribute('value');
            if (!val1) throw new Error(`Collection option ${collectionTitle} not found`);
            await page.selectOption('select[name="collectionId"]', val1);

            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/\/prompts\//); // Redirects to details

            // Prompt 2
            await page.goto('/prompts/new');
            await page.fill('input[name="title"]', promptTitle2);
            await page.fill('textarea[name="content"]', 'Test content 2');

            await page.locator('select[name="collectionId"]').click();
            const option2 = page.locator('select[name="collectionId"] option').filter({ hasText: collectionTitle }).first();
            const val2 = await option2.getAttribute('value');
            if (!val2) throw new Error(`Collection option ${collectionTitle} not found`);
            await page.selectOption('select[name="collectionId"]', val2);

            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/\/prompts\//);
        });

        // 3. Navigate to Collection (Grid View)
        await test.step('Verify Grid View', async () => {
            // Click collection in sidebar
            await page.locator('aside').getByText(collectionTitle).click();

            // Wait for navigation
            await page.waitForURL(/\/collections\//);

            // Verify we are NOT on a specific prompt (no ?promptId query param initially)
            const url = page.url();
            expect(url).not.toContain('promptId=');

            // Verify Grid Headers
            await expect(page.locator('h2').filter({ hasText: collectionTitle })).toBeVisible();

            // Verify Prompt Cards are present
            // Look for card titles inside grid
            await expect(page.locator('.card').filter({ hasText: promptTitle1 })).toBeVisible();
            await expect(page.locator('.card').filter({ hasText: promptTitle2 })).toBeVisible();
        });

        // 4. Click a card
        await test.step('Navigate from Grid to Detail', async () => {
            await page.locator('.card').filter({ hasText: promptTitle1 }).click();

            // PromptCard navigates to full prompt detail page typically
            await page.waitForURL(/\/prompts\//);
            await expect(page.locator('h1').filter({ hasText: promptTitle1 })).toBeVisible();
        });
    });
});
