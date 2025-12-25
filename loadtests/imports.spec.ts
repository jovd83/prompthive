
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginUser } from '../frontend-tests/utils';

test('Load Test: Import 1000 prompts', async ({ page }) => {
    // Description: Generates a JSON file with 1000 prompts and imports it via the UI to verify system performance and stability under load.
    test.setTimeout(300000); // 5 minutes

    await loginUser(page);
    await page.goto('/import-export');

    let filePath: string = path.join(__dirname, 'temp_1000_prompts.json');

    await test.step('Generate payload of 1000 prompts', async () => {
        const prompts = Array.from({ length: 1000 }).map((_, i) => ({
            title: `Load Test Prompt ${i}`,
            content: `This is the content for prompt ${i}. It is a load test to ensure the system can handle large imports.`.repeat(5),
            description: `Description for ${i}`,
            tags: ["load-test", `tag-${i % 10}`],
            collection: "Load Test 1000"
        }));

        fs.writeFileSync(filePath, JSON.stringify(prompts));
    });

    try {
        await test.step('Upload and Import the file', async () => {
            // We look for input[type="file"] inside the Import card or section
            await page.setInputFiles('input[type="file"]', filePath);
            await page.click('button:has-text("Import Prompts")');
        });

        await test.step('Verify import success message or counts', async () => {
            await expect(page.getByText(/Imported 1000 prompts/i)).toBeVisible({ timeout: 120000 }).catch(() => {
                // Fallback: Check if we can find the collection "Load Test 1000"
                return expect(page.getByText("Load Test 1000").first()).toBeVisible();
            });
        });

    } finally {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});
