import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Collection Sorting', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should sort prompts in collection by name and date', async ({ page }) => {
        const timestamp = Date.now();
        const collectionTitle = `Sort Collection ${timestamp}`;

        // 1. Create Collection
        await page.goto('/collections/new');
        await page.fill('input[name="title"]', collectionTitle);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/collections/);

        // 2. Create Prompts inside the collection
        // We use the "New Prompt" button inside the collection view to pre-fill collectionId
        await page.reload();
        await page.locator('aside').getByText(collectionTitle).click();
        await expect(page.locator('h1')).toContainText(collectionTitle);

        const createPrompt = async (title: string, delay: number = 0) => {
            if (delay > 0) await page.waitForTimeout(delay);

            // Click New Prompt in the collection header
            await page.click('a:has-text("New Prompt")');

            await page.fill('input[name="title"]', title);
            await page.fill('textarea[name="content"]', 'Content');
            await page.click('button[type="submit"]');

            // Wait for redirect back to collection
            await expect(page).toHaveURL(/\/collections\//);

            // Navigate back to collection root view
            await page.locator('aside').getByText(collectionTitle).click();
        };

        // Create in specific order
        await createPrompt(`B - Middle ${timestamp}`);
        await createPrompt(`A - Oldest ${timestamp}`, 1000);
        await createPrompt(`C - Newest ${timestamp}`, 1000);

        // Helper to interact with the new dropdown menu
        const clickSortOption = async (name: string) => {
            // Click the trigger button (MoreHorizontal icon)
            await page.getByLabel('Sort options').click();
            await expect(page.locator('div[role="menu"]')).toBeVisible();
            // Click the option in the menu
            await page.getByRole('menuitem').filter({ hasText: name }).first().click();
            await page.waitForTimeout(500);
        };

        // 3. Verify Default Sort (Date Descending / Newest First)
        // Prompts should be: C, A, B
        const getPromptTitles = async () => {
            await expect(page.locator('div.border-r h4.font-medium')).toHaveCount(3);
            return await page.locator('div.border-r h4.font-medium').allInnerTexts();
        };

        let titles = await getPromptTitles();
        titles = titles.filter(t => t.includes(timestamp.toString()));

        expect(titles[0]).toContain('C - Newest');
        expect(titles[1]).toContain('A - Oldest');
        expect(titles[2]).toContain('B - Middle');

        // 4. Sort by Name (Z - A)
        await clickSortOption('Z - A');

        titles = await getPromptTitles();
        titles = titles.filter(t => t.includes(timestamp.toString()));
        expect(titles[0]).toContain('C - Newest');
        expect(titles[1]).toContain('B - Middle');
        expect(titles[2]).toContain('A - Oldest');

        // 5. Sort by Name (A - Z)
        await clickSortOption('A - Z');

        titles = await getPromptTitles();
        titles = titles.filter(t => t.includes(timestamp.toString()));
        expect(titles[0]).toContain('A - Oldest');
        expect(titles[1]).toContain('B - Middle');
        expect(titles[2]).toContain('C - Newest');

        // 6. Sort by Newest First
        await clickSortOption('Newest First');

        titles = await getPromptTitles();
        titles = titles.filter(t => t.includes(timestamp.toString()));
        expect(titles[0]).toContain('C - Newest');
        expect(titles[1]).toContain('A - Oldest');
        expect(titles[2]).toContain('B - Middle');

        // 7. Sort by Oldest First
        await clickSortOption('Oldest First');

        titles = await getPromptTitles();
        titles = titles.filter(t => t.includes(timestamp.toString()));
        expect(titles[0]).toContain('B - Middle');
        expect(titles[1]).toContain('A - Oldest');
        expect(titles[2]).toContain('C - Newest');
    });
});
