import { test, expect } from '@playwright/test';
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

test.describe('User Registration', () => {

    test.beforeEach(async () => {
        // Ensure global registration is enabled for the default tests
        const globalConfig = await prisma.globalConfiguration.findFirst();
        if (globalConfig) {
            await prisma.globalConfiguration.update({
                where: { id: globalConfig.id },
                data: { registrationEnabled: true }
            });
        } else {
            await prisma.globalConfiguration.create({
                data: { registrationEnabled: true, privatePromptsEnabled: true }
            });
        }
    });

    test('Successful User Registration (Happy Path)', async ({ page }) => {
        const uniqueUsername = `testuser_${Date.now()}`;
        const uniqueEmail = `${uniqueUsername}@example.com`;

        await page.goto('/register');

        // Using placeholders as they were confirmed by Planner
        await page.getByPlaceholder('username').fill(uniqueUsername);
        await page.getByPlaceholder('user@example.com').fill(uniqueEmail);
        await page.getByPlaceholder('Basic password').fill('Password123!');

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();

        // Verify Redirection
        await page.waitForURL('**/login?registered=true*');

        // Wait for the success message to be strictly visible
        await expect(page.getByText('Account created successfully')).toBeVisible();

        // Clean up created user to not pollute db
        await prisma.user.delete({ where: { username: uniqueUsername } }).catch(() => { });
    });

    test('Error on Duplicate Email and Username', async ({ page }) => {
        const username = `existing_${Date.now()}`;
        const email = `${username}@example.com`;

        // Setup: Create a user in the database
        await prisma.user.create({
            data: {
                id: uuidv4(),
                username: username,
                email: email,
                passwordHash: 'HashedPassword123!',
                role: 'USER',
            }
        });

        await page.goto('/register');

        // Test duplicate email
        await page.getByPlaceholder('username').fill(`different_${Date.now()}`);
        await page.getByPlaceholder('user@example.com').fill(email);
        await page.getByPlaceholder('Basic password').fill('Password123!');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Expect error
        await expect(page.getByText('Email already registered', { exact: false })).toBeVisible();

        // Test duplicate username
        await page.getByPlaceholder('username').fill(username);
        await page.getByPlaceholder('user@example.com').fill(`different_${Date.now()}@example.com`);
        await page.getByPlaceholder('Basic password').fill('Password123!');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Expect error
        await expect(page.getByText('Username already taken', { exact: false })).toBeVisible();

        // Clean up
        await prisma.user.delete({ where: { username: username } }).catch(() => { });
    });

    test('Registration Disabled', async ({ page }) => {
        // Setup: Disable registration
        const globalConfig = await prisma.globalConfiguration.findFirst();
        if (globalConfig) {
            await prisma.globalConfiguration.update({
                where: { id: globalConfig.id },
                data: { registrationEnabled: false }
            });
        } else {
            await prisma.globalConfiguration.create({
                data: { registrationEnabled: false, privatePromptsEnabled: true }
            });
        }

        await page.goto('/register');
        await page.getByPlaceholder('username').fill(`disabled_${Date.now()}`);
        await page.getByPlaceholder('user@example.com').fill(`disabled_${Date.now()}@example.com`);
        await page.getByPlaceholder('Basic password').fill('Password123!');
        await page.getByRole('button', { name: 'Submit' }).click();

        // Expect Error
        await expect(page.locator('.text-red-500')).toContainText('Registration is currently disabled by the administrator');
    });

});
