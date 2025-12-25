import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
    const password = 'Password123!';

    test.setTimeout(60000); // Increase timeout for slower environments

    test('should register a new user', async ({ page }) => {
        const username = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const email = `${username}@example.com`;

        await test.step('Navigate to login page', async () => {
            await page.goto('/login');
        });

        await test.step('Navigate to registration page', async () => {
            await page.click('text=Create New User');
            await expect(page).toHaveURL('/register');
        });

        await test.step('Fill registration form', async () => {
            await page.locator('input[placeholder="username"]').pressSequentially(username, { delay: 100 });
            await page.locator('input[placeholder="user@example.com"]').pressSequentially(email, { delay: 50 });
            await page.fill('input[placeholder="Basic password"]', password);

            // Verify inputs are filled
            await expect(page.locator('input[placeholder="username"]')).toHaveValue(username);
            await expect(page.locator('input[placeholder="user@example.com"]')).toHaveValue(email);
            await expect(page.locator('input[placeholder="Basic password"]')).toHaveValue(password);
        });

        await test.step('Submit registration', async () => {
            // Debug listener for alerts/errors
            page.on('dialog', dialog => console.log('Dialog opened:', dialog.message()));
            await page.click('button[type="submit"]');
            await page.waitForLoadState('networkidle');
        });

        await test.step('Verify registration success and redirect to login', async () => {
            try {
                await expect(page).toHaveURL(/\/login\?registered=true/, { timeout: 30000 });
            } catch (e) {
                // If redirection fails, check for error message
                if (await page.locator('.text-red-500').isVisible()) {
                    const errorText = await page.locator('.text-red-500').textContent();
                    throw new Error(`Registration failed with message: ${errorText}`);
                }
                // Check if we are still on /register
                if (page.url().includes('/register')) {
                    throw new Error('Registration form did not submit or stayed on page without error message.');
                }
                throw e;
            }
            await expect(page.locator('text=Account created successfully')).toBeVisible();
        });
    });

    test('should login with the registered user', async ({ page }) => {
        const uniqueUser = `login_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const uniqueEmail = `${uniqueUser}@example.com`;

        // Quick registration for this test
        await page.goto('/register');
        await page.fill('input[placeholder="username"]', uniqueUser);
        await page.fill('input[placeholder="user@example.com"]', uniqueEmail);
        await page.fill('input[placeholder="Basic password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/login\?registered=true/);

        await test.step('Navigate to login page', async () => {
            await page.goto('/login');
        });

        await test.step('Fill login credentials', async () => {
            await page.fill('input[placeholder="username"]', uniqueUser);
            await page.fill('input[placeholder="••••••••"]', password);
        });

        await test.step('Submit login', async () => {
            await page.click('button[type="submit"]');
        });

        await test.step('Verify successful login and redirect to dashboard', async () => {
            await expect(page).toHaveURL('/');
            await expect(page.locator('button[data-testid="user-profile-trigger"]')).toBeVisible();
        });
    });
});
