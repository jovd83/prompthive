import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Workflow Visibility Settings', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should toggle workflow visibility in sidebar', async ({ page }) => {
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        console.log('Test: Starting workflow visibility test');
        // 1. Verify Workflows hidden by default (or initial state)
        await page.goto('/settings');

        // Wait for setting to load
        await expect(page.locator('h2', { hasText: 'General Settings' })).toBeVisible();

        const workflowToggle = page.getByTestId('workflow-toggle');

        // Ensure it is unchecked initially
        if (await workflowToggle.isChecked()) {
            await workflowToggle.uncheck();
            await page.click('button:has-text("Save General Settings")');
            await expect(page.locator('text=Settings saved successfully')).toBeVisible();
            await page.reload(); // Reload to ensure sidebar updates
        }

        // Check Sidebar (should be hidden)
        await expect(page.locator('aside a[href="/workflows"]')).not.toBeVisible();

        // 2. Enable Workflows
        await workflowToggle.check();
        await page.click('button:has-text("Save General Settings")');
        await expect(page.locator('text=Settings saved successfully')).toBeVisible();
        await page.reload(); // Reload for server update

        // 3. Verify Sidebar (should be visible)
        await expect(page.locator('aside a[href="/workflows"]')).toBeVisible();

        // 4. Disable Workflows
        // Navigate back to settings if reload took us elsewhere (though it shouldn't)
        if (page.url().indexOf('/settings') === -1) {
            await page.goto('/settings');
        }
        await workflowToggle.uncheck();
        await page.click('button:has-text("Save General Settings")');
        await expect(page.locator('text=Settings saved successfully')).toBeVisible();
        await page.reload();

        // 5. Verify Sidebar Hidden
        await expect(page.locator('aside a[href="/workflows"]')).not.toBeVisible();
    });
});
