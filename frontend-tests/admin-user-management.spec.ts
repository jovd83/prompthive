import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

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
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // Go to Settings
        await page.goto('/settings');

        // Check for User Management Section
        await expect(page.getByText('User Management')).toBeVisible();

        // Add User
        await page.click('button:has-text("Add User")');
        await expect(page.getByText('Add New User')).toBeVisible();

        await page.fill('input[value=""] >> nth=0', 'test_created_user'); // Username - fragile selector but functional if sequential
        // Better to use labels if available or placeholder
        // My component code: params are bound to value, placeholders not unique?
        // Let's use getByLabel if possible or placeholders if I added them
        // "Username", "Email", "Password" labels exist.

        await page.getByLabel('Username').fill('test_created_user');
        await page.getByLabel('Email').fill('test_created@example.com');
        await page.getByLabel('Password').fill('password123');
        await page.selectOption('select', 'USER');

        await page.click('button:has-text("Create User")');

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
