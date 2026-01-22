
import { test, expect } from '@playwright/test';

test.describe('Export Selection Features', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication
        await page.context().addCookies([{
            name: 'next-auth.session-token',
            value: 'mock-token',
            domain: 'localhost',
            path: '/'
        }]);
    });

    test('should allow selecting collections and exporting for both Standard and Zero', async ({ page }) => {
        test.setTimeout(60000); // Increase timeout for slow envs
        // Create a collection first to ensure export is enabled
        await page.goto('/');
        await page.getByRole('link', { name: "Collections" }).click();

        // Check if "No collections" is present or list. 
        // If we can create one quickly.
        // Or assume we can just create one via API if possible. 
        // Best E2E way: Create via UI.

        // This relies on "New Collection" flow working.
        // A simpler way is to route '/import-export' response logic if possible, but we can't mock Server Component data easily.
        // Let's create one.
        // Wait, creating requires filling a form?
        // Let's try to find "New Collection" button.
        await page.getByRole('button', { name: /New Collection/i }).click();
        await page.getByLabel('Title').fill('Export Test Collection');
        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByText('Export Test Collection')).toBeVisible();

        // Now go to import-export
        await page.goto('/import-export');

        // Mock the Zero Export API
        await page.route('/api/export-zero', async route => {
            const request = route.request();
            const postData = request.postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        // Mock the Standard Export API
        await page.route('/api/export', async route => {
            const request = route.request();
            if (request.method() === 'POST') {
                const postData = request.postDataJSON();
                // Expect collectionIds
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([{ id: 'p1', title: 'Test' }])
                });
            } else {
                route.continue();
            }
        });

        await page.goto('/import-export');

        // Check if the card exists
        const standardHeader = page.locator('.card').filter({ hasText: 'Export Prompts' }).first();
        await expect(standardHeader).toBeVisible();

        const zeroHeader = page.locator('.card').filter({ hasText: 'Export for PromptHive Zero' }).first();
        await expect(zeroHeader).toBeVisible();

        // 1. Test Standard Export
        const standardSelectAll = standardHeader.getByRole('button', { name: "Select All" });
        await expect(standardSelectAll).toBeVisible();
        await standardSelectAll.click();

        const stdDownloadPromise = page.waitForEvent('download');
        await standardHeader.getByRole('button', { name: "Download JSON" }).click();
        const stdDownload = await stdDownloadPromise;
        expect(stdDownload.suggestedFilename()).toContain('myprompthive-backup-');

        // 2. Test Zero Export
        const zeroSelectAll = zeroHeader.getByRole('button', { name: "Select All" });
        await expect(zeroSelectAll).toBeVisible();
        await zeroSelectAll.click();

        const zeroDownloadPromise = page.waitForEvent('download');
        // Button text is now "Export for PromptHive Zero" in English
        await zeroHeader.getByRole('button', { name: "Export for MyPromptHive Zero" }).click();
        const zeroDownload = await zeroDownloadPromise;
        expect(zeroDownload.suggestedFilename()).toContain('myprompthive-zero-export-');
    });
});
