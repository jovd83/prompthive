
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test('reproduce bug: unable to unfavorite the last favorite on dashboard', async ({ page }) => {
    // 1. Login
    await loginUser(page);

    // 2. Create a prompt
    const timestamp = Date.now();
    const promptTitle = `Bug Repro Prompt ${timestamp}`;

    await page.goto('/prompts/new');
    await page.fill('input[name="title"]', promptTitle);
    await page.fill('textarea[name="content"]', 'Content for bug repro');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/prompts\/.+/);

    // 3. Favorite it from the detail page
    const headerFavButton = page.locator('button[title="Add to favorites"]');
    await expect(headerFavButton).toBeVisible();
    await headerFavButton.click();
    await expect(page.locator('button[title="Remove from favorites"]')).toBeVisible();

    // 4. Go to Dashboard
    await page.goto('/');

    // 5. Verify it appears in Favorites section AND Recently Used section (since I created it)
    const favSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Favorites' }) });
    const recentSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Recently Used' }) });

    await expect(favSection).toBeVisible();
    await expect(recentSection).toBeVisible();

    const cardInFav = favSection.locator('.card', { hasText: promptTitle }).first();
    const cardInRecent = recentSection.locator('.card', { hasText: promptTitle }).first();

    await expect(cardInFav).toBeVisible();
    await expect(cardInRecent).toBeVisible();

    // Verify both are favorited visually
    await expect(cardInFav.locator('button[title="Remove from favorites"]')).toBeVisible();
    await expect(cardInRecent.locator('button[title="Remove from favorites"]')).toBeVisible();

    // 6. Click "Unfavorite" on the card in FAVORITES section
    const cardUnfavBtn = cardInFav.locator('button[title="Remove from favorites"]');
    await cardUnfavBtn.click();

    // 7. Verify expectation: 
    // - Favorites section card should disappear
    // - Recently Used card should UPDATE to be unfavorited

    // wait for network idle to ensure revalidation
    await page.waitForLoadState('networkidle');
    // Extra safety wait for React hydration/updates
    await page.waitForTimeout(2000);

    // The favorites section card should be gone
    await expect(cardInFav).not.toBeVisible();

    // The recently used card should be unfavorited (Client-side sync check)
    await expect(cardInRecent).toBeVisible();
    await expect(cardInRecent.locator('button[title="Remove from favorites"]')).not.toBeVisible();
    await expect(cardInRecent.locator('button[title="Add to favorites"]')).toBeVisible();
});
