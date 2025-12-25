import { Page, expect } from '@playwright/test';



export async function loginUser(page: Page) {
    const username = `test_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';

    // Register
    await page.goto('/register');
    await expect(page.locator('h1:has-text("Create New User")')).toBeVisible();
    await page.fill('input[placeholder="username"]', username);
    await page.fill('input[placeholder="user@example.com"]', email);
    await page.fill('input[placeholder="Basic password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login\?registered=true/);

    // Login
    await page.goto('/login');
    await expect(page.locator('h1:has-text("PromptHive")')).toBeVisible();
    await page.fill('input[placeholder="username"]', username);
    await page.fill('input[placeholder="••••••••"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
    // Check for dashboard element to confirm session is active
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Check for sidebar elements - updated to use the ID which is more stable
    await expect(page.locator('button[data-testid="user-profile-trigger"]')).toBeVisible();

    return { username, email, password };
}

export async function promoteUserToAdmin(page: Page) {
    // Open User Profile
    await page.locator('button[data-testid="user-profile-trigger"]').click();

    // Switch to Preferences tab
    await page.locator('[data-testid="tab-preferences"]').click();

    // Click the toggle to open Admin code modal
    // The input is hidden (sr-only), so we click the visual representation or label
    await page.locator('label:has-text("Admin Access")').click({ force: true });

    // Wait for modal
    await expect(page.locator('input[name="code"]')).toBeVisible();

    // Enter code
    await page.fill('input[name="code"]', 'HIVE25');

    // Submit
    await page.click('button:has-text("Verify")');

    // Verify success
    await expect(page.locator('text=You are now an Administrator')).toBeVisible();

    // Close dialog
    await page.keyboard.press('Escape');
    // Wait for animation
    await page.waitForTimeout(500);
}

// Helper to ensure section is expanded
export async function ensureExpanded(pageArg: Page, name: string) {
    // Escape regex characters
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const btn = pageArg.getByRole('button', { name: new RegExp(escapedName, 'i') });
    if (await btn.count() === 0) {
        // Try exact: false if needed, but 'name' usually matches
        console.warn(`ensureExpanded: Button "${name}" not found.`);
        return;
    }

    // We added aria-expanded to CollapsibleSection. 
    // If it's missing (null), we assume it's closed (default) and click.
    const isExpanded = await btn.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
        await btn.click();
        await expect(btn).toHaveAttribute('aria-expanded', 'true');
    }
}
