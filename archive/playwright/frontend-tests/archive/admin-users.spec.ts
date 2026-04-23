
import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Admin User Management', () => {
    test.setTimeout(120000); // DB operations can be slow
    const adminUser = 'admin_delete_test';
    const targetUser = 'user_to_delete';
    const password = 'password123';

    const deleteUsers = async (usernames: string[]) => {
        const users = await prisma.user.findMany({
            where: { username: { in: usernames } },
            select: { id: true }
        });
        const ids = users.map(u => u.id);
        if (ids.length === 0) return;

        await prisma.settings.deleteMany({ where: { userId: { in: ids } } });
        await prisma.favorite.deleteMany({ where: { userId: { in: ids } } });
        await prisma.collection.deleteMany({ where: { ownerId: { in: ids } } });
        await prisma.workflow.deleteMany({ where: { ownerId: { in: ids } } });
        // Clean workflow steps referencing prompts owned by users
        await prisma.workflowStep.deleteMany({
            where: { prompt: { createdById: { in: ids } } }
        });
        await prisma.prompt.deleteMany({ where: { createdById: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
    };

    test.beforeAll(async () => {
        console.log('TEST RUNNER DB URL:', process.env.DATABASE_URL);
        // Cleanup
        await deleteUsers([adminUser, targetUser]);

        const passwordHash = await hash(password, 10);

        // Create/Ensure Admin
        await prisma.user.upsert({
            where: { username: adminUser },
            update: { passwordHash },
            create: { username: adminUser, email: `${adminUser}@example.com`, role: 'ADMIN', passwordHash }
        });

        // Create Target User
        const target = await prisma.user.create({
            data: { username: targetUser, email: `${targetUser}@example.com`, role: 'USER', passwordHash }
        });

        // Create Content for Target User (to verify preservation)
        await prisma.prompt.create({
            data: {
                title: 'User To Delete Prompt',
                description: 'Content should be preserved',
                createdById: target.id,
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'This content must survive',
                        createdById: target.id
                    }
                }
            }
        });
    });

    test('Admin should be able to delete a user and inherit their content', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.getByPlaceholder('username').fill(adminUser);
        await page.getByPlaceholder('••••••••').fill(password);
        await page.locator('button[type="submit"]').click();
        try {
            await page.waitForURL('/', { timeout: 60000 });
        } catch (e) {
            console.log('Current URL:', page.url());
            throw e;
        }

        // Go to Settings > Admin
        await page.goto('/settings');

        // Ensure Admin Section is Open (Robust Logic)
        const adminButton = page.getByRole('button', { name: 'Admin Configuration' });
        await expect(adminButton).toBeVisible();
        const expandedState = await adminButton.getAttribute('aria-expanded');
        if (expandedState !== 'true') {
            await adminButton.click();
            await page.waitForTimeout(500);
        }

        await page.getByText("User Management").waitFor();

        // Search for target user
        await page.fill('input[placeholder*="Search users"]', targetUser);

        // Find the row
        const userRow = page.locator('tr', { hasText: targetUser });
        await expect(userRow).toBeVisible({ timeout: 10000 });

        // Click delete button (trash icon)
        const deleteBtn = page.getByTestId(`delete-user-${targetUser}`);
        await deleteBtn.click();

        // Expect Confirmation Dialog
        const dialog = page.getByTestId('confirmation-dialog');
        await expect(dialog).toBeVisible({ timeout: 10000 });
        await expect(dialog).toContainText("Are you sure you want to delete this user?");

        // Confirm
        await dialog.getByRole('button', { name: "Delete" }).click();

        // Verify success message
        await expect(page.getByText(`${targetUser} deleted successfully`)).toBeVisible();

        // Verify user is gone from table
        await expect(dialog).not.toBeVisible();
        await expect(userRow).not.toBeVisible();

        // START: Verify Content Preservation
        // Navigate to dashboard/search
        await page.goto('/');

        // Search for the prompt created by the deleted user
        await page.fill('input[placeholder="Search prompts..."]', 'User To Delete Prompt');
        await page.keyboard.press('Enter');

        // Expect prompt to still exist
        const promptCard = page.locator('article', { hasText: 'User To Delete Prompt' });
        await expect(promptCard).toBeVisible();

        // Optional: Open detail and check owner is now Admin
        await promptCard.click();
        await expect(page.getByText(`By ${adminUser}`)).toBeVisible();
    });

    test.afterAll(async () => {
        await deleteUsers([adminUser, targetUser]);
    });
});
