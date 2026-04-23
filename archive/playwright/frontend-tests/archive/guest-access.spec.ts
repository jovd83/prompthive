import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Guest Access Control', () => {
    const adminUser = 'admin_guest_test';
    const guestUser = 'guest_user_test';
    const password = 'password123';
    let promptId: string;

    test.beforeAll(async () => {
        // Cleanup
        try {
            await prisma.prompt.deleteMany({ where: { title: 'Guest Test Prompt' } });
            await prisma.user.deleteMany({ where: { OR: [{ username: adminUser }, { username: guestUser }] } });
        } catch (e) {
            console.error("Cleanup failed", e);
        }

        // Create or Update Admin (Upsert)
        const passwordHash = await hash(password, 10);
        const admin = await prisma.user.upsert({
            where: { username: adminUser },
            update: { passwordHash, role: 'ADMIN', email: `${adminUser}@example.com` },
            create: { username: adminUser, email: `${adminUser}@example.com`, role: 'ADMIN', passwordHash }
        });

        // Create a Prompt for testing
        const prompt = await prisma.prompt.create({
            data: {
                title: 'Guest Test Prompt',
                description: 'Testing guest',
                createdById: admin.id,
                versions: {
                    create: {
                        content: 'Test content version',
                        createdById: admin.id,
                        versionNumber: 1
                    }
                }
            }
        });
        promptId = prompt.id;
    });

    test('Admin can create a Guest user', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('input[name="username"]', adminUser);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // Verify Admin Link is GONE from sidebar
        await expect(page.locator('a[href="/admin/users"]')).not.toBeVisible();

        // Navigate to Settings
        await page.goto('/settings');

        // Verify Settings Title
        await expect(page.getByText('Settings', { exact: true }).first()).toBeVisible();

        // Open Add User Modal
        // Using a more specific selector
        await page.click('button:has-text("Add User")');

        // Modal should be visible
        const modal = page.locator('div.fixed.inset-0.z-50');
        await expect(modal).toBeVisible();

        // Fill Form
        // Scoping to modal
        await modal.locator('input[type="text"]').first().fill(guestUser);
        await modal.locator('input[type="email"]').fill(`${guestUser}@example.com`);
        await modal.locator('input[type="password"]').fill(password);

        // Select Role GUEST
        await modal.locator('select').selectOption('GUEST');

        // Submit
        await modal.locator('button:has-text("Create")').click();

        // Wait for modal to close (optional) or checking user appearances
        // Verify user in the list
        await expect(page.locator('tr').filter({ hasText: guestUser })).toBeVisible();

        // Verify Role
        const userRow = page.locator('tr').filter({ hasText: guestUser });
        await expect(userRow.locator('select')).toHaveValue('GUEST');
    });

    test('Guest user has read-only access', async ({ page }) => {
        // Login as Guest
        await page.goto('/login');
        await page.fill('input[name="username"]', guestUser);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // 1. Sidebar Restrictions
        await expect(page.locator('a[href="/admin/users"]')).not.toBeVisible();
        await expect(page.locator('a[href="/prompts/new"]')).not.toBeVisible();

        // 2. Prompt Detail Restrictions
        await page.goto(`/prompts/${promptId}`);
        // Edit button should be hidden
        await expect(page.locator('a[href$="/edit"]')).not.toBeVisible();
        // Delete button should be hidden
        await expect(page.getByRole('button', { name: /delete/i })).not.toBeVisible();

        // Favorite button should be disabled
        const favBtn = page.locator('button[title*="Favorites"]');
        if (await favBtn.isVisible()) {
            await expect(favBtn).toBeDisabled();
        }

        // 3. Collection Restrictions
        await page.goto('/');
        await expect(page.getByRole('link', { name: 'New Prompt' })).not.toBeVisible();
    });

    test.afterAll(async () => {
        try {
            await prisma.prompt.deleteMany({ where: { title: 'Guest Test Prompt' } });
            await prisma.user.deleteMany({ where: { username: { in: [adminUser, guestUser] } } });
        } catch (e) {
            console.error("Cleanup failed in afterAll", e);
        }
    });
});
