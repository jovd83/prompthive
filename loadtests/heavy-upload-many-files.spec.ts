
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginUser } from '../frontend-tests/utils';

test('Stress Test: Create prompt with 10 results and 10 attachments', async ({ page }) => {
    test.setTimeout(180000);
    await loginUser(page);
    await page.goto('/prompts/new');

    const files: string[] = [];
    try {
        for (let i = 0; i < 20; i++) {
            const fp = path.join(__dirname, `temp_small_${i}.txt`);
            fs.writeFileSync(fp, `Content ${i}`);
            files.push(fp);
        }

        const attachments = files.slice(0, 10);
        const results = files.slice(10, 20);

        await page.fill('input[name="title"]', 'Many Files Prompt');
        await page.fill('textarea[name="content"]', 'Testing multiple files.');

        await page.setInputFiles('label:has-text("Add Attachment") input[type="file"]', attachments);
        await page.setInputFiles('label:has-text("Result Image") input[type="file"]', results);

        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/\/prompts\//, { timeout: 60000 });
        await expect(page.getByText('Many Files Prompt')).toBeVisible();

    } finally {
        files.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    }
});
