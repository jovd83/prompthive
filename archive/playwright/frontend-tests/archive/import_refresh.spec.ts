import { test, expect } from '@playwright/test';
import { loginUser } from './utils';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Import Sidebar Refresh', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should refresh sidebar collections after importing a JSON file', async ({ page }) => {
        const timestamp = Date.now();
        const collectionName = `Import Refresh Col ${timestamp}`;

        // 1. Create a mock import file (V2 format to create collection)
        const importData = {
            version: 2,
            exportedAt: new Date().toISOString(),
            prompts: [
                {
                    id: `mock-prompt-${timestamp}`,
                    title: `Prompt in ${collectionName}`,
                    content: "Test Content",
                    collectionId: `col-${timestamp}`
                }
            ],
            definedCollections: [
                {
                    id: `col-${timestamp}`,
                    title: collectionName,
                    description: "Imported for refresh test"
                }
            ]
        };

        const fileName = `import-refresh-test-${timestamp}.json`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, JSON.stringify(importData));

        try {
            // 2. Go to Import Page
            await page.goto('/import-export');

            // 3. Upload File
            const fileInput = page.locator('input[name="file"][type="file"]');
            await fileInput.setInputFiles(filePath);

            // 4. Submit Import
            await page.click('button:has-text("Import Standard/Batch")'); // Adjust selector based on actual button text

            // 5. Wait for Success Message OR Sidebar update
            // Sometimes toast is fast or missed. We ultimately care about sidebar.
            const sidebarLink = page.locator(`a:has-text("${collectionName}")`).first();
            await expect(sidebarLink).toBeVisible({ timeout: 20000 });

            // Optional: Check toast if visible, but don't fail hard
            // await expect(page.locator('text=Import complete')).toBeVisible({ timeout: 5000 }).catch(() => console.log("Toast missed/not found"));

        } finally {
            // Cleanup
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });
});
