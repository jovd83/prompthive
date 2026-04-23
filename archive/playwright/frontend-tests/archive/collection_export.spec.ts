import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Collection Export from Sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should download a JSON file when clicking Export on a collection', async ({ page }) => {
        const timestamp = Date.now();
        const collectionName = `Export Test Col ${timestamp}`;

        // 1. Create a Collection via UI
        await page.goto('/collections');
        await page.fill('input[placeholder="New Collection Name"]', collectionName);
        await page.click('button:has-text("Create")');
        // Wait for it to appear
        await expect(page.locator(`text=${collectionName}`)).toBeVisible();

        // 2. Click the collection to make it active (navigate to /collections/:id)
        // This ensures the header menu knows which collection to export.
        await page.click(`a:has-text("${collectionName}")`);

        // Ensure URL is correct
        await expect(page).toHaveURL(/\/collections\/.+/);

        // 3. Open the Sidebar Header "Sort/Options" menu
        // It's the button with title "Sort Collections" in the sidebar header
        const menuTrigger = page.locator('button[title="Sort Collections"]').first();
        await expect(menuTrigger).toBeVisible();
        await menuTrigger.click();

        // 4. Click "Export" option
        // The menu should now contain "Export "Export Test Col...""
        const exportButton = page.locator(`button:has-text("Export")`);
        // We can be more specific: has-text("${collectionName}") but it might be truncated.
        // Just checking "Export" is reasonably safe if no other export button is there.
        await expect(exportButton).toBeVisible();

        // Intercept download
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();
        const download = await downloadPromise;

        // 5. Verify Download
        const suggestedFilename = download.suggestedFilename();
        expect(suggestedFilename).toContain('backup.json');

        // Validate JSON content
        const stream = await download.createReadStream();
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        const json = JSON.parse(buffer.toString());

        expect(json.version).toBe(2);
        const hasDefinedCollection = json.definedCollections?.some((c: any) => c.title === collectionName);
        expect(hasDefinedCollection).toBeTruthy();
    });
});
