import { test, expect, Page } from '@playwright/test';
import { loginUser } from './utils';

test.describe.serial('Search and Discovery Epic', () => {
    let page: Page;
    let testUser: any;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        testUser = await loginUser(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Scenario 1: Advanced Search', async () => {
        // Go to dashboard
        await page.goto('/');

        // Locate search bar (using placeholder which might be translated, but we can look for 'Search...' or the input inside a div with relative flex-1)
        // From AdvancedSearch.tsx, it has a placeholder that is translated, but maybe we can just get the first text input that isn't hidden.
        // Let's use the toggle button for filters as an anchor
        const toggleButton = page.getByRole('button', { name: /Toggle filters/i });
        const parentDiv = toggleButton.locator('..').locator('..'); // go up to the container
        const searchInput = parentDiv.locator('input[type="text"]').first();

        // Type a keyword and press enter
        await searchInput.fill('PlaywrightTest');
        await searchInput.press('Enter');

        // Verify URL contains q=PlaywrightTest
        await page.waitForURL(/q=PlaywrightTest/, { timeout: 10000 });

        // Open filter options
        await toggleButton.click();

        // Wait for expanded panel
        const tagInput = page.locator('input[placeholder="coding, writing, seo"]');
        const creatorInput = page.locator('input[placeholder="admin@example.com"]');

        await expect(tagInput).toBeVisible();

        await tagInput.fill('testing');
        await creatorInput.fill('qa@example.com');

        // Click apply
        await page.getByRole('button', { name: /Apply/i }).click();

        // Verify URL
        await page.waitForURL(/tags=testing/, { timeout: 10000 });
        await page.waitForURL(/creator=qa%40example\.com/, { timeout: 10000 });

        // Open filter again and clear
        await toggleButton.click();
        await page.getByRole('button', { name: /Clear/i }).click();

        // Verify URL params removed
        await page.waitForURL(url => !url.search.includes('q=') && !url.search.includes('tags='), { timeout: 10000 });
    });

    test('Scenario 2: Command Palette and Navigation', async () => {
        await page.goto('/');

        // Give the page a moment to ensure key listeners are attached
        await page.waitForTimeout(500);

        // Press Ctrl+K
        const isMac = process.platform === 'darwin';
        if (isMac) {
            await page.keyboard.press('Meta+K');
        } else {
            await page.keyboard.press('Control+K');
        }

        // Wait for Command Palette modal to open
        const paletteInput = page.locator('input[placeholder="Type a command or search..."]');
        await expect(paletteInput).toBeVisible({ timeout: 5000 });

        // Search for Theme
        await paletteInput.fill('Theme');

        // Find the toggle theme option
        const themeOption = page.getByRole('option', { name: /Toggle Theme/i });
        await expect(themeOption).toBeVisible({ timeout: 5000 });

        // Click it
        await themeOption.click();

        // Press Ctrl+K again to verify we can run options
        await page.waitForTimeout(500);
        if (isMac) {
            await page.keyboard.press('Meta+K');
        } else {
            await page.keyboard.press('Control+K');
        }

        await expect(paletteInput).toBeVisible({ timeout: 5000 });
        await paletteInput.fill('New Prompt');

        const newPromptOption = page.getByRole('option', { name: /Create New Prompt/i });
        await expect(newPromptOption).toBeVisible();
        await newPromptOption.click();

        // Wait for navigation
        await page.waitForURL(/\/prompts\/new$/, { timeout: 10000 });
    });
});
