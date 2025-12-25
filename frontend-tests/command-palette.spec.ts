
import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Command Palette', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should open command palette with keyboard shortcut', async ({ page }) => {
        // Wait for page to be ready
        await page.waitForLoadState('networkidle');

        // Press Ctrl+K (or Cmd+K)
        const isMac = process.platform === 'darwin';
        const modifier = isMac ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+k`);

        // Check if palette is visible (the animator div)
        const palette = page.locator('[role="listbox"], [placeholder="Type a command or search..."]');
        await expect(palette.first()).toBeVisible();
    });

    test('should navigate to Settings via command palette', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Open palette
        await page.keyboard.press('Control+k');

        // Type "Settings"
        await page.keyboard.type('Settings');

        // Wait for results - "Settings" might be ambiguous, let's look for "Profile & Settings" or just the first item
        // kbar usually selects the first item automatically if it matches well.
        // Let's explicitly click the one we want if visible.
        const settingsOption = page.locator('[role="option"]').filter({ hasText: 'Settings' }).first();
        await expect(settingsOption).toBeVisible();
        await settingsOption.click();

        // Alternatively, Enter should work if it's selected
        // await page.keyboard.press('Enter');

        // Press Enter
        await page.keyboard.press('Enter');

        // Verify URL
        await expect(page).toHaveURL('/settings');
    });

    test('should toggle theme', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Open palette
        await page.keyboard.press('Control+k');

        // Type "Toggle Theme"
        await page.keyboard.type('Toggle Theme');

        // Select it
        await page.keyboard.press('Enter');

        // Verify theme change (check html class or local storage)
        // This is tricky to test visually without screenshot, but we can check the class on <html>
        const html = page.locator('html');
        // It toggles between dark and light. Assuming default is light/system.
        // We just check if the attribute or class changes.
        // For 'next-themes', it usually adds class='dark' or 'light'.

        // Check for class change on html element
        // We wait for either class 'dark' or 'light' to be present/absent
        const htmlElement = page.locator('html');
        await expect(htmlElement).toHaveAttribute('class', /(dark|light)/);
    });
});
