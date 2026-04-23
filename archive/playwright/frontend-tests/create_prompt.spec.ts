import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import path from 'path';

test.describe('Create Prompt', () => {

    const testUsername = `promptuser_${Date.now()}`;
    const testPassword = 'Password123!';

    test.beforeEach(async ({ page }) => {
        // Setup valid user in DB
        const passwordHash = await bcrypt.hash(testPassword, 10);
        await prisma.user.upsert({
            where: { username: testUsername },
            update: {},
            create: {
                id: uuidv4(),
                username: testUsername,
                email: `${testUsername}@example.com`,
                passwordHash: passwordHash,
                role: 'USER',
                settings: {
                    create: { id: uuidv4(), autoBackupEnabled: false }
                }
            }
        });

        // Ensure registration/private prompts configurations exist
        const globalConfig = await prisma.globalConfiguration.findFirst();
        if (!globalConfig) {
            await prisma.globalConfiguration.create({
                data: { registrationEnabled: true, privatePromptsEnabled: true }
            });
        }

        // Log the user in
        await page.goto('/login');
        await page.getByPlaceholder('username').fill(testUsername);
        await page.locator('input[type="password"]').fill(testPassword);
        await page.getByRole('button', { name: 'Sign In', exact: false }).click();
        await page.waitForURL('**/');
    });

    test.afterEach(async () => {
        // Cleanup valid user
        await prisma.user.delete({ where: { username: testUsername } }).catch(() => { });
    });

    test('Scenario 1: Require Content', async ({ page }) => {
        await page.goto('/prompts/new');

        // Fill Title
        await page.locator('input[name="title"]').fill('My empty prompt');
        // Do not fill Content

        // Wait to make sure DOM is interactive
        await page.waitForTimeout(500);

        // Click Submit. Since content is required, the browser itself should block submission or form shouldn't navigate.
        await page.locator('button[type="submit"]').click();

        // Wait briefly to ensure we do not navigate
        await page.waitForTimeout(1000);
        expect(page.url().includes('/prompts/new')).toBeTruthy();
    });

    test('Scenario 2: Auto-Add Variables Detects Syntaxes', async ({ page }) => {
        await page.goto('/prompts/new');

        await page.locator('input[name="title"]').fill('Variables Prompt');
        await page.locator('textarea[name="content"]').fill('Hello {{name}} and [[age]] !');

        // Wait a small amount
        await page.waitForTimeout(500);

        // Click Auto Add Variables
        // Either "Auto-add" or similar in English default
        const autoAddBtn = page.locator('button', { hasText: /Auto/i }).first();
        await autoAddBtn.click();

        // Check if two variables were added
        await expect(page.locator('input[class*="w-[40ch]"]').nth(0)).toHaveValue('name');
        await expect(page.locator('input[class*="w-[40ch]"]').nth(1)).toHaveValue('age');

        // Submit
        await page.locator('button[type="submit"]').click();

        // Should land on prompt details page
        await page.waitForURL('**/prompts/*');
        expect(page.url().includes('/prompts/')).toBeTruthy();
    });

    test('Scenario 3: Attachments File Upload', async ({ page }) => {
        await page.goto('/prompts/new');

        await page.locator('input[name="title"]').fill('File Upload Prompt');

        await page.locator('textarea[name="content"]').fill('Prompt with an attachment');

        // Open the Attachments section (it's collapsed by default)
        await page.getByRole('button', { name: /Attachments/i }).click();

        await page.locator('input[type="file"]').nth(1).setInputFiles('test_attachment.txt');

        await expect(page.locator('span.truncate').filter({ hasText: 'test_attachment.txt' }).first()).toBeVisible();

        // Submit
        await page.locator('button[type="submit"]').click();

        // Should land on prompt details page
        await page.waitForURL('**/prompts/*');

        // Look for the attachment original filename
        await expect(page.getByText('test_attachment.txt').first()).toBeVisible();
    });

});
