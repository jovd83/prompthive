import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
// NextAuth uses standard bcrypt
import bcrypt from 'bcryptjs';

test.describe('User Login', () => {

    const testUsername = `loginuser_${Date.now()}`;
    const testPassword = 'Password123!';

    test.beforeEach(async () => {
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
            }
        });
    });

    test.afterEach(async () => {
        // Cleanup valid user
        await prisma.user.delete({ where: { username: testUsername } }).catch(() => { });
    });

    test('Successful User Login (Happy Path)', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder('username').fill(testUsername);
        await page.locator('input[type="password"]').fill(testPassword);

        // Submit
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Verify Redirection to Dashboard /
        await page.waitForURL('**/');
        // We should see some dashboard element, assume header or something exists. We'll wait for URL for now.
        expect(page.url().endsWith('/')).toBeTruthy();
    });

    test('Error on Invalid Credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByPlaceholder('username').fill('invaliduser');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Expect error
        await expect(page.locator('.text-red-500', { hasText: 'Invalid credentials' }).or(page.getByText('Invalid credentials', { exact: false }))).toBeVisible();
    });

    test('Verify Registration Success Message', async ({ page }) => {
        await page.goto('/login?registered=true');

        // Expect success message
        await expect(page.getByText('Account created successfully. Please sign in.', { exact: false })).toBeVisible();
    });

});
