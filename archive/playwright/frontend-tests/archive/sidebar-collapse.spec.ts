import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Sidebar Collapse/Expand', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
        await page.goto('/');
    });

    test('should toggle collections section', async ({ page }) => {
        // Initial state: Expanded
        // "Collapse Collections" button should be visible (title)
        const collapseBtn = page.getByTitle('Collapse Collections');
        await expect(collapseBtn).toBeVisible();

        // The header text should be visible/clickable
        // Use exact match for the link to avoid matching "No collections" or "Unassigned collections"
        await expect(page.getByRole('link', { name: 'Collections', exact: true })).toBeVisible();

        // Click collapse
        await collapseBtn.click();

        // Check for expand button
        const expandBtn = page.getByTitle('Expand Collections');
        await expect(expandBtn).toBeVisible();
        await expect(page.getByTitle('Collapse Collections')).not.toBeVisible();

        // Click expand
        await expandBtn.click();
        await expect(page.getByTitle('Collapse Collections')).toBeVisible();
    });

    test('should toggle tags section', async ({ page }) => {
        // Initial state: Expanded
        const collapseBtn = page.getByTitle('Collapse Tags');
        await expect(collapseBtn).toBeVisible();

        // Header check
        await expect(page.getByRole('heading', { name: 'Tags' })).toBeVisible();

        // Click collapse
        await collapseBtn.click();

        // Check for expand button
        const expandBtn = page.getByTitle('Expand Tags');
        await expect(expandBtn).toBeVisible();
        await expect(page.getByTitle('Collapse Tags')).not.toBeVisible();

        // Click expand
        await expandBtn.click();
        await expect(page.getByTitle('Collapse Tags')).toBeVisible();
    });

    test('should toggle system section and keep profile visible', async ({ page }) => {
        // Initial state: System Expanded
        const collapseBtn = page.getByTitle('Collapse System');
        await expect(collapseBtn).toBeVisible();

        // Settings link should be visible
        await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

        // User Profile should be visible
        const profileBtn = page.getByTestId('user-profile-trigger');
        await expect(profileBtn).toBeVisible();

        // Click collapse System
        await collapseBtn.click();

        // Check for expand button
        const expandBtn = page.getByTitle('Expand System');
        await expect(expandBtn).toBeVisible();

        // Settings link should NOT be visible (it's removed from DOM when collapsed)
        await expect(page.getByRole('link', { name: 'Settings' })).not.toBeVisible();

        // User Profile should STILL be visible
        await expect(profileBtn).toBeVisible();

        // Click expand
        await expandBtn.click();
        await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    });
});
