import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

test.describe('Guest Access Gaps', () => {
    const guestUser = 'guest_gap_test';
    const password = 'password123';
    let promptId: string;
    let collectionId: string;

    test.beforeAll(async () => {
        // Cleanup
        try {
            await prisma.user.deleteMany({ where: { username: guestUser } });
        } catch (e) { }

        // Create Guest User
        const passwordHash = await hash(password, 10);
        const user = await prisma.user.create({
            data: { username: guestUser, email: `${guestUser}@example.com`, role: 'GUEST', passwordHash }
        });

        // Create Prompt & Collection as Admin (or just system) for viewing
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!admin) throw new Error("No admin found to create content");

        const collection = await prisma.collection.create({
            data: { title: 'Guest View Collection', ownerId: admin.id }
        });
        collectionId = collection.id;

        const prompt = await prisma.prompt.create({
            data: {
                title: 'Guest Download Test',
                description: 'Testing guest download',
                createdById: admin.id,
                collections: { connect: { id: collection.id } },
                versions: {
                    create: {
                        content: 'Test content',
                        createdById: admin.id,
                        versionNumber: 1,
                        resultText: "Result text",
                        // Attachments would be harder to mock without file upload, but resultText presence triggers result section
                    }
                }
            }
        });
        promptId = prompt.id;
    });

    test('Guest UI Restrictions', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[name="username"]', guestUser);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // 1. Sidebar: Check Import/Export hiding
        // "System" section might be collapsed or expanded. 
        // We look for the link /import-export or text "Import/Export"
        const importExportLink = page.getByRole('link', { name: /Import\/Export/i });
        await expect(importExportLink).not.toBeVisible();

        // 2. User Menu: Check Preferences hiding
        await page.click('button[data-testid="user-profile-trigger"]');
        const userModal = page.locator('button[data-testid="tab-preferences"]');
        await expect(userModal).not.toBeVisible();

        // Close modal
        await page.keyboard.press('Escape');

        // 3. Prompt Detail: Check Download Button
        await page.goto(`/prompts/${promptId}`);
        const downloadMDBtn = page.locator('button[title*="Download Markdown"]');
        // Expect button to be visible but disabled
        await expect(downloadMDBtn).toBeVisible();
        await expect(downloadMDBtn).toBeDisabled();


        // 3b. Prompt Detail: Check Delete Button
        const deleteBtn = page.locator('button[title*="Deletion is restricted"]');
        await expect(deleteBtn).toBeVisible();
        await expect(deleteBtn).toBeDisabled();

        // Check Result/Attachment download
        // Assuming result section is visible
        const resultSection = page.getByText('Results');
        await expect(resultSection).toBeVisible();
        // Check for any download icon/link in results
        // This might be tricky if we don't have attachments, but we can check checking the "Download" text if present
        // or just ensure generic download buttons are gone?
        // Let's stick to the Markdown download button which is surely there for others.

        // 4. Collection View: New Prompt Button
        await page.goto(`/collections/${collectionId}`);
        const newPromptBtn = page.getByRole('link', { name: "New Prompt" });
        await expect(newPromptBtn).not.toBeVisible();

        // 5. Drag/Drop Error (Hard to sim drag in Playwright sometimes, but we can try)
        // This part might be manual verification if complex, but let's try basic drag if possible.
        // Or simply checking if the ERROR UI container exists in the main layout vs sidebar.
        // Skipping complex drag test for now to focus on static UI gaps first.
    });

    test.afterAll(async () => {
        try {
            await prisma.user.deleteMany({ where: { username: guestUser } });
            if (promptId) await prisma.prompt.delete({ where: { id: promptId } });
            if (collectionId) await prisma.collection.delete({ where: { id: collectionId } });
        } catch (e) { }
    });
});
