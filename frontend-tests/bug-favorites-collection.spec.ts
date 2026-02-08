
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.setTimeout(60000);

test.describe('Favorites in Collection View Bug', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should correctly reflect favorite status in collection grid', async ({ page }) => {
        const timestamp = Date.now();
        const collectionTitle = `FavBug Collection ${timestamp}`;
        const promptTitleA = `FavBug A ${timestamp}`;
        const promptTitleB = `FavBug B ${timestamp}`;

        // 1. Create a Collection
        // Using UI to ensure we are in a clean state or use API if available (mocking UI flow for realism)
        await page.goto('/collections');
        // If empty state or list, find 'New Collection'
        // Simpler: Use URL direct creation if possible, but UI is safer for E2E
        // Let's assume we can create via Sidebar "+" or similar.
        // Sidebar has a "New Collection" button usually?
        // Let's go to /collections/new?parentId= if possible or use the create button.
        await page.goto('/'); // Dashboard has sidebar
        // Expand collections if needed? 
        // Direct link to create:
        await page.goto('/collections/new'); // Assuming this route works or dialog
        // Based on Sidebar code: <Link href={/collections/new?parentId=${collection.id}} ...
        // But let's try just /collections/new for root

        // Wait for form
        await expect(page.locator('h1')).toContainText(/New Collection/i);
        await page.fill('input[name="title"]', collectionTitle);
        await page.click('button[type="submit"]');

        // Wait for redirect to collection
        await expect(page).toHaveURL(/\/collections\/.+/);
        const collectionUrl = page.url();
        const collectionId = collectionUrl.split('/').pop();

        // 2. Create Prompt A in this collection
        await page.goto(`/prompts/new?collectionId=${collectionId}`);
        await page.fill('input[name="title"]', promptTitleA);
        await page.fill('textarea[name="content"]', 'Content A');
        await page.click('button[type="submit"]'); // Create
        await expect(page).toHaveURL(/\/prompts\/.+/);
        const promptUrlA = page.url();
        const promptIdA = promptUrlA.split('/').pop();

        // Favorite Prompt A immediately from detail page
        await page.locator('button[title="Add to favorites"]').click();
        await expect(page.locator('button[title="Remove from favorites"]')).toBeVisible();

        // 3. Create Prompt B in this collection (NOT Favorites)
        await page.goto(`/prompts/new?collectionId=${collectionId}`);
        await page.fill('input[name="title"]', promptTitleB);
        await page.fill('textarea[name="content"]', 'Content B');
        await page.click('button[type="submit"]');

        // 4. Go to Collection View (Grid)
        // We need to go to the collection URL without a prompt selected.
        // If we are on prompt detail, we might be in split view.
        // Click on collection name in breadcrumb or refresh clean URL.
        await page.goto(collectionUrl); // this should be /collections/[id]

        // Ensure we see the grid
        await expect(page.locator('h2', { hasText: collectionTitle })).toBeVisible();

        // 5. Verify Favorite Status of A (BUG EXPECTATION: Fails here)
        const cardA = page.locator('.card', { hasText: promptTitleA });
        await expect(cardA).toBeVisible();

        // Check for filled heart or specific class/title
        // The PromptCard uses: button title="Remove from favorites" vs "Add to favorites"
        // Also text-red-500 class.
        // We expect it to be favorited.
        const heartA = cardA.locator('button[title="Remove from favorites"]');

        // This assertion is expected to FAIL if the bug exists
        await expect(heartA, 'Prompt A should be favorited in collection view').toBeVisible();

        // 6. Verify Favorite Status of B (Should be empty)
        const cardB = page.locator('.card', { hasText: promptTitleB });
        await expect(cardB).toBeVisible();
        const heartB = cardB.locator('button[title="Add to favorites"]');
        await expect(heartB).toBeVisible();
    });
});
