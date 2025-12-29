import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma'; // Assumes direct DB access for setup/teardown in tests
import { hash } from 'bcryptjs';

test.setTimeout(60000);

test.describe('Admin Registration Toggle', () => {

    test.beforeAll(async () => {
        // Ensure admin user exists (if running isolated or seed didn't run)
        const passwordHash = await hash('admin123', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { role: 'ADMIN', passwordHash },
            create: { username: 'admin', email: 'admin@test.com', role: 'ADMIN', passwordHash }
        });

        // Ensure registration is enabled by default
        await prisma.globalConfiguration.upsert({
            where: { id: "GLOBAL" },
            update: { registrationEnabled: true },
            create: { id: "GLOBAL", registrationEnabled: true }
        });
    });

    test('Admin can disable registration', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('input[name="username"]', 'admin'); // Assuming seeded admin
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // Go to Settings
        await page.goto('/settings');

        // Check for Admin Section
        const adminSection = page.getByText('Admin Configuration');
        await expect(adminSection).toBeVisible();
        await adminSection.click(); // Open if needed

        // Toggle Registration to OFF
        const toggle = page.locator('input[type="checkbox"]').nth(1); // MIGHT BE FRAGILE if multiple checkboxes. Better locator needed.
        // Better:
        const regToggle = page.getByLabel('Enable User Registration'); // Provided we used label correctly or aria-label
        // My code: <label className="relative..."><input type="checkbox" ... /></label>
        // It doesn't have explicit "Enable User Registration" text association via `for` or `aria-label`. 
        // The text is in a sibling div.
        // Let's rely on text proximity or just use the nth checkbox if it's the only one in that section.
        // Actually, let's fix the accessibility in the component later, for now query by context.

        // Click the label wrapper - Scoped by heading and taking first to avoid nested div strict mode issues
        await page.locator('div').filter({ has: page.getByRole('heading', { name: 'Enable User Registration' }) }).locator('input[type="checkbox"]').first().uncheck();

        await page.getByText('Save Admin Settings').click();
        await expect(page.getByText('Admin settings updated successfully')).toBeVisible();

        // Logout
        await page.getByRole('button', { name: /admin/i }).click(); // Avatar/name
        await page.getByText('Sign Out').click();

        // Attempt Registration
        await page.goto('/register');
        await page.fill('input[name="username"]', 'newuser_disabled');
        await page.fill('input[name="email"]', 'newuser_disabled@test.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Expect Error
        await expect(page.getByText('Registration is currently disabled')).toBeVisible();
    });

    test.afterAll(async () => {
        // Reset to enabled
        await prisma.globalConfiguration.update({
            where: { id: "GLOBAL" },
            data: { registrationEnabled: true }
        });
    });
});
