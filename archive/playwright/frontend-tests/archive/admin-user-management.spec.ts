import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

test.setTimeout(60000);

test.describe('Admin User Management', () => {

    test.beforeAll(async () => {
        // Ensure admin and cleanup
        const passwordHash = await hash('admin123', 10);
        await prisma.user.upsert({
            where: { username: 'admin' },
            update: { role: 'ADMIN', passwordHash },
            create: { username: 'admin', email: 'admin@test.com', role: 'ADMIN', passwordHash }
        });

        // Cleanup test user if exists
        await prisma.user.deleteMany({
            where: { username: 'test_created_user' }
        });
    });

    test('Admin can create user and toggle role', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder('username').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.locator('button[type="submit"]').click();
        await expect(page).toHaveURL('/');

        // Go to Settings
        await page.goto('/settings');

        // Ensure Admin Section is Open (Robust Logic)
        const adminButton = page.getByRole('button', { name: 'Admin Configuration' });
        await expect(adminButton).toBeVisible();
        const expandedState = await adminButton.getAttribute('aria-expanded');
        if (expandedState !== 'true') {
            await adminButton.click();
            await page.waitForTimeout(500);
        }

        // Check for User Management Section
        await expect(page.getByText('User Management')).toBeVisible();

        // Add User
        await page.getByRole('button', { name: 'Add User' }).click();
        await expect(page.getByRole('heading', { name: 'Add New User' })).toBeVisible();

        await page.getByLabel('Username').fill('test_created_user');
        await page.getByLabel('Email').fill('test_created@example.com');
        await page.getByLabel('Password').fill('password123');
        await page.getByLabel('Role').selectOption('USER');

        await page.getByRole('button', { name: 'Create User' }).click();

        // Check list
        await expect(page.getByText('test_created_user')).toBeVisible();
        await expect(page.getByText('test_created@example.com')).toBeVisible();

        // Toggle Role
        // Find row with new user
        const row = page.getByRole('row').filter({ hasText: 'test_created_user' });
        // It starts as USER
        await expect(row.getByText('USER')).toBeVisible();

        // Click role button
        await row.getByRole('button').click();

        // Should flip to ADMIN (optimistic or after fetch)
        await expect(row.getByText('ADMIN')).toBeVisible();

        // Verify in DB
        const user = await prisma.user.findUnique({ where: { username: 'test_created_user' } });
        expect(user?.role).toBe('ADMIN');
    });
});
