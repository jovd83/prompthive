import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Guest New Prompt Button Restrictions', () => {
    const guestUser = 'guest_prompt_btn_test';
    const password = 'password123';

    test.beforeAll(async () => {
        // Cleanup
        try {
            await prisma.user.deleteMany({ where: { username: guestUser } });
        } catch (e) { }

        // Create Guest User
        const passwordHash = await hash(password, 10);
        await prisma.user.create({
            data: { username: guestUser, email: `${guestUser}@example.com`, role: 'GUEST', passwordHash }
        });
    });

    test('Guest cannot see New Prompt or New Collection buttons', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[name="username"]', guestUser);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // 1. Sidebar: Check "New Prompt" link
        const sidebarNewPrompt = page.getByRole('link', { name: "New Prompt" });
        await expect(sidebarNewPrompt).not.toBeVisible();

        // 2. Sidebar collections header: Check "New Collection" (+) button
        // The + button has title "New Collection"
        const sidebarNewCollection = page.locator('a[title="New Collection"]');
        await expect(sidebarNewCollection).not.toBeVisible();

        // 3. Dashboard: Check if there's a big "Create Prompt" button (if exists in design)
        // Usually dashboards have one. Let's check for any link with href="/prompts/new"
        const anyNewPromptLink = page.locator('a[href="/prompts/new"]');
        await expect(anyNewPromptLink).toHaveCount(0);

        // 4. Collections Page (just to be sure)
        await page.goto('/collections');
        const collectionNewPrompt = page.getByRole('link', { name: "New Prompt" });
        await expect(collectionNewPrompt).not.toBeVisible();
    });

    test.afterAll(async () => {
        try {
            await prisma.user.deleteMany({ where: { username: guestUser } });
        } catch (e) { }
    });
});
