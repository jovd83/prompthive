
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.setTimeout(60000);

test.describe('Favorites Feature', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should allow a user to favorite and unfavorite a prompt', async ({ page }) => {
        // Create a prompt first
        const timestamp = Date.now();
        const promptTitle = `Fav Test Prompt ${timestamp}`;
        const promptContent = 'Test content for favorites';

        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', promptContent);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/);

        // Verify we are on detail page and can favorite
        // The heart button should be present.
        const headerFavButton = page.locator('button[title="Add to favorites"]');
        await expect(headerFavButton).toBeVisible();

        // Favorite from Detail Page
        await headerFavButton.click();
        await expect(page.locator('button[title="Remove from favorites"]')).toBeVisible();

        // Go to Dashboard
        await page.goto('/');

        // Verify it appears in Favorites section (first row)
        // We can inspect the "Favorites" section header
        // Verify it appears in Favorites section (first row)
        // We can inspect the "Favorites" section header
        const favSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Favorites' }) });
        await expect(favSection).toBeVisible();
        const cardInFav = favSection.locator('.card', { hasText: promptTitle });
        await expect(cardInFav).toBeVisible();

        // Verify visual indicator on card
        const cardFavBtn = cardInFav.locator('button[title="Remove from favorites"]');
        await expect(cardFavBtn).toBeVisible();

        // Go to Favorites Page via Sidebar
        await page.click('a[href="/favorites"]');
        await expect(page).toHaveURL('/favorites');
        await expect(page.locator('h1:has-text("My Favorites")')).toBeVisible();

        // Find card
        const favPageCard = page.locator('.card', { hasText: promptTitle });
        await expect(favPageCard).toBeVisible();

        // Unfavorite from Favorites Page
        const favPageBtn = favPageCard.locator('button[title="Remove from favorites"]');
        await favPageBtn.click();

        // Confirm click by waiting for state change (optimistic or real)
        await expect(favPageCard.locator('button[title="Add to favorites"]')).toBeVisible();

        await page.waitForTimeout(2000); // Give it a sec to settle/revalidate

        // Verify persistence with reload
        await page.reload();
        // After reload, the card should be gone OR the empty state should be visible. 
        // Note: If tests run in parallel or state is dirty, other prompts might exist.
        // We strictly check our prompt title is gone.
        await expect(page.locator('.card', { hasText: promptTitle })).not.toBeVisible();
    });

    test('should allow searching and sorting favorites', async ({ page }) => {
        // Setup: Create 2 prompts with different titles and dates, and favorite them.
        const timestamp = Date.now();
        const p1Title = `Apple Prompt ${timestamp}`;
        const p2Title = `Banana Prompt ${timestamp}`;

        // Create P1
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', p1Title);
        await page.fill('textarea[name="content"]', 'Content 1');
        await page.click('button[type="submit"]');
        await page.locator('button[title="Add to favorites"]').click();

        // Create P2
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', p2Title);
        await page.fill('textarea[name="content"]', 'Content 2');
        await page.click('button[type="submit"]');
        await page.locator('button[title="Add to favorites"]').click();

        // Go to favorites
        await page.goto('/favorites');

        // Check both present
        await expect(page.locator('.card', { hasText: p1Title })).toBeVisible();
        await expect(page.locator('.card', { hasText: p2Title })).toBeVisible();

        // Search for "Apple"
        await page.getByTestId('favorites-search').fill('Apple');
        await page.getByTestId('favorites-search').press('Enter');

        // Wait for URL update
        await expect(page).toHaveURL(/q=Apple/);

        // Check P1 present, P2 hidden
        await expect(page.locator('.card', { hasText: p1Title })).toBeVisible();
        await expect(page.locator('.card', { hasText: p2Title })).not.toBeVisible();

        // Clear search
        await page.getByTestId('favorites-clear').click();
        // Wait for URL update (query params removed)
        await expect(page).toHaveURL(/\/favorites$/);

        await expect(page.locator('.card', { hasText: p2Title })).toBeVisible();

        // Sort Z-A
        await page.getByTestId('favorites-sort').selectOption('alpha-desc');
        await page.getByTestId('favorites-filter').click();
        // We can verify URL param
        await expect(page).toHaveURL(/sort=alpha-desc/);
    });
});
