import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Help Center', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should navigate to help page from sidebar', async ({ page }) => {
        // Use exact name match to avoid ambiguity with "Help" vs "Help & Manual"
        await page.getByRole('link', { name: 'Help & Manual', exact: true }).click();
        await expect(page).toHaveURL('/help');
        await expect(page.getByRole('heading', { level: 1, name: 'Help Center' })).toBeVisible();
    });

    test('should display all documentation sections', async ({ page }) => {
        await page.goto('/help');
        await page.waitForLoadState('domcontentloaded');

        // Check sidebar navigation links
        const expectedLinks = [
            'Introduction',
            'Getting Started',
            'Variables & Syntax',
            'Collections & structure',
            'AI Web Scraping Guide',
            'Command Palette',
            'FAQ & Troubleshooting'
        ];

        for (const linkText of expectedLinks) {
            // Use stricter matching and check visibility
            await expect(page.locator(`button:has-text("${linkText}")`).first()).toBeVisible();
        }

        // Check main content headers
        for (const linkText of expectedLinks) {
            await expect(page.getByRole('heading', { name: linkText, level: 2 })).toBeVisible();
        }
    });

    test('should scroll to section when clicking sidebar link', async ({ page }) => {
        await page.goto('/help');
        await page.waitForLoadState('domcontentloaded');

        // Click the sidebar button
        await page.click('button:has-text("AI Web Scraping Guide")');

        // Wait for potential scroll animation
        await page.waitForTimeout(1000);

        // Verify the section is in the viewport (or close to top)
        await expect(page.getByRole('heading', { name: 'AI Web Scraping Guide', level: 2 })).toBeInViewport();
    });

    test('should display the AI system prompt in code block', async ({ page }) => {
        await page.goto('/help');
        await page.waitForLoadState('domcontentloaded');

        // Navigate to scraping section
        await page.click('button:has-text("AI Web Scraping Guide")');

        // Check for the system prompt content
        await expect(page.locator('pre:has-text("**Role**: You are an expert data scraper")')).toBeVisible();
    });
});
