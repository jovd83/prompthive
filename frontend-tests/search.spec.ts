import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should perform simple search', async ({ page }) => {
        const searchTerm = 'SEO';

        await test.step('Enter search term', async () => {
            await page.fill('input[placeholder="Search prompts..."]', searchTerm);
            await page.press('input[placeholder="Search prompts..."]', 'Enter');
        });

        await test.step('Verify URL params', async () => {
            await expect(page).toHaveURL(new RegExp(`q=${searchTerm}`));
        });

        await test.step('Verify search results header', async () => {
            // Use specific locator or text to avoid ambiguity
            await expect(page.locator('h1').filter({ hasText: `Search: "${searchTerm}"` })).toBeVisible();
        });
    });

    test('should perform advanced search', async ({ page }) => {
        await test.step('Open advanced filters', async () => {
            // Using accessibility label added previously
            await page.getByLabel('Toggle filters').click();
            await expect(page.locator('input[placeholder="coding, writing, seo"]')).toBeVisible();
        });

        await test.step('Fill advanced fields', async () => {
            await page.fill('input[placeholder="coding, writing, seo"]', 'test-tag');
            await page.fill('input[placeholder="admin@example.com"]', 'test@user.com');
        });

        await test.step('Apply filters', async () => {
            await page.click('button:has-text("Apply Filters")');
        });

        await test.step('Verify URL params for filters', async () => {
            await expect(page).toHaveURL(/tags=test-tag/);
            await expect(page).toHaveURL(/creator=test%40user\.com/);
        });
    });
});
