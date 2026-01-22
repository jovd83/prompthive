import { test, expect } from '@playwright/test';
import { loginUser } from './utils';
import fs from 'fs';
import path from 'path';

test.describe('Import / Export', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should display import/export options', async ({ page }) => {
        await test.step('Navigate to Import/Export page', async () => {
            await page.goto('/import-export');
            await expect(page).toHaveURL('/import-export');
        });

        await test.step('Check Export section', async () => {
            await expect(page.locator('h2:has-text("Export Prompts")')).toBeVisible();
            await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible();
        });

        await test.step('Check Import section', async () => {
            await expect(page.locator('h2:has-text("Import Prompts")')).toBeVisible();
            // Verify files input is present
            const count = await page.locator('input[name="file"]').count();
            expect(count).toBeGreaterThanOrEqual(1);
        });
    });

    test('should try export download', async ({ page }) => {
        await page.goto('/import-export');

        // Setup download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

        // Click the export button
        await page.getByRole('button', { name: 'Download JSON' }).click();

        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/myprompthive-backup-.*\.json/);

        // Verify success message appears (optional, depends on speed)
        await expect(page.getByText('Export complete')).toBeVisible({ timeout: 10000 });
    });
});
