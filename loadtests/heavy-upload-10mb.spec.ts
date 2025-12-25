
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginUser } from '../frontend-tests/utils';

test('Stress Test: Create prompt with 10MB attachment', async ({ page }) => {
    test.setTimeout(180000);
    await loginUser(page);
    await page.goto('/prompts/new');

    const filePath = path.join(__dirname, 'temp_11mb.bin');
    try {
        const buffer = Buffer.alloc(11 * 1024 * 1024);
        fs.writeFileSync(filePath, buffer);

        await test.step('Upload 11MB file', async () => {
            await page.fill('input[name="title"]', 'Heavy Attachment Prompt');
            await page.fill('textarea[name="content"]', 'Testing large file upload.');
            await page.setInputFiles('label:has-text("Add Attachment") input[type="file"]', filePath);
            await page.click('button[type="submit"]');
        });

        await test.step('Verify creation', async () => {
            await expect(page).toHaveURL(/\/prompts\//, { timeout: 60000 });
            await expect(page.getByText('Heavy Attachment Prompt')).toBeVisible();
        });

    } finally {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
});
