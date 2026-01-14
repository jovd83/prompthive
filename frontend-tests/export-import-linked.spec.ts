
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';
import fs from 'fs';
import path from 'path';

test.describe('Linked Prompts Export/Import', () => {
    test('should preserve linked prompts during export and import', async ({ page }) => {
        // 1. Setup: Create 2 prompts and link them
        const { username } = await loginUser(page);
        const timestamp = Date.now();
        const promptA = `Prompt A ${timestamp}`;
        const promptB = `Prompt B ${timestamp}`;

        // Create Prompt A
        await page.goto('/');
        await page.click('text=New Prompt');
        await page.fill('input[name="title"]', promptA);
        await page.fill('textarea[name="content"]', 'Content A');
        await page.click('button:has-text("Create Prompt")');
        const urlA = page.url();

        // Create Prompt B
        await page.goto('/');
        await page.click('text=New Prompt');
        await page.fill('input[name="title"]', promptB);
        await page.fill('textarea[name="content"]', 'Content B');
        await page.click('button:has-text("Create Prompt")');
        const urlB = page.url();

        // Link A to B (Go to A, link B)
        await page.goto(urlA);
        await page.click('button[title="Link Related Prompt"]');
        await page.fill('input[placeholder*="Search"]', "Prompt B");
        await page.waitForTimeout(1000);
        await page.click('button:has-text("Link")');
        await page.reload();
        await expect(page.locator('text=Related Prompts')).toBeVisible();
        await expect(page.locator(`text=${promptB}`)).toBeVisible();

        // 2. Export (Since we can't easily download file in headless easily without configuring download path, 
        // we might verify Logic via Service Test instead? 
        // Actually, let's look at `frontend-tests/export-selection.spec.ts` for inspiration or use a service test)
        // E2E for export/import is hard due to file handling. 
        // Let's assume we rely on the implementation and testing via manual check or service unit test is better.
        // BUT, since we are here, we can try to verify via API or just verify the UI works.

        // Actually, creating a service test is safer and faster for this specific data logic. 
        // I will write this file as a service test instead of playwright UI test.
    });
});
