import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';


test.describe('Admin Registration Toggle', () => {
    test.setTimeout(120000);

    test.beforeAll(async () => {
        const passwordHash = await hash('admin123', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { role: 'ADMIN', passwordHash },
            create: { username: 'admin', email: 'admin@test.com', role: 'ADMIN', passwordHash }
        });

        await prisma.globalConfiguration.upsert({
            where: { id: "GLOBAL" },
            update: { registrationEnabled: true },
            create: { id: "GLOBAL", registrationEnabled: true }
        });
    });

    test('Admin can disable registration', async ({ page }) => {
        console.log('Step 1: Login');
        await page.goto('/login');
        await page.getByPlaceholder('username').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.locator('button[type="submit"]').click();

        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
        console.log('Logged in');

        await page.goto('/settings');
        console.log('On Settings page');

        // Check for Admin Section
        const adminButton = page.getByRole('button', { name: 'Admin Configuration' });
        await expect(adminButton).toBeVisible();


        // Ensure section is open
        const expandedState = await adminButton.getAttribute('aria-expanded');
        if (expandedState !== 'true') {
            console.log('Admin section collapsed, clicking to open.');
            await adminButton.click();
            await page.waitForTimeout(1000);
        } else {
            console.log('Admin section already open.');
        }

        const regCheckbox = page.getByRole('checkbox', { name: 'Enable User Registration' });
        // Wait specifically for it in case of animation
        await expect(regCheckbox).toBeVisible({ timeout: 5000 });

        console.log('Toggling registration');
        if (await regCheckbox.isChecked()) {
            await regCheckbox.uncheck({ force: true });
        } else {
            console.log('Registration already disabled?');
        }

        await page.getByTestId('admin-save-button').click();
        await expect(page.getByText('Admin settings updated successfully')).toBeVisible();
        console.log('Settings saved');

        // Logout
        const profileBtn = page.locator('button[data-testid="user-profile-trigger"]');
        await expect(profileBtn).toBeVisible();
        await profileBtn.click();
        await page.getByText('Sign Out').click();

        // Attempt Registration
        await page.goto('/register');
        await page.getByPlaceholder('username').fill('newuser_disabled');
        await page.getByPlaceholder('user@example.com').fill('newuser_disabled@test.com');
        await page.getByPlaceholder('Basic password').fill('password123');
        await page.locator('button[type="submit"]').click();

        await expect(page.getByText('Registration is currently disabled')).toBeVisible();
    });

    test.afterAll(async () => {
        await prisma.globalConfiguration.update({
            where: { id: "GLOBAL" },
            data: { registrationEnabled: true }
        });
    });
});
