
import { test, expect } from '@playwright/test';

test.describe('Help Page Scraper Copy', () => {
    test('copy button exists and copies system prompt', async ({ page, context }) => {
        // Grant clipboard permissions
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.goto('/help');

        // Scroll to section or click nav
        await page.getByText('AI Scraping').first().click();

        // Locate the copy button in the scraper section
        // The button is inside the section with id 'ai-scraping'
        const scraperSection = page.locator('#ai-scraping');
        const copyButton = scraperSection.locator('button[title="Copy to clipboard"]');

        await expect(copyButton).toBeVisible();

        // Click copy
        await copyButton.click();

        // Check button state change
        await expect(page.getByText('Copied')).toBeVisible();

        // Verify clipboard content
        const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
        const clipboardContent = await handle.jsonValue();

        expect(clipboardContent).toContain('**Role**: You are an expert data scraper');
        expect(clipboardContent).toContain('**Target JSON Schema**:');
    });
});
