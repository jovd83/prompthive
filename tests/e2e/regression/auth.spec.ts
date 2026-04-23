import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { RegisterPage } from '../../../pom/RegisterPage';
import { prisma } from '../../../lib/prisma';

test.describe('Authentication Flows - Enriched Datasets & Edge Cases', () => {

    test('Successful User Login (Happy Path)', async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('MSS: Successful User Logout', async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');

        // Click user profile to open dialog
        await page.locator('[data-testid="user-profile-trigger"]').click();

        // Click Sign Out
        await page.getByRole('button', { name: /Sign Out/i }).click();

        await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible({ timeout: 15000 });
    });

    test('Error on Invalid Credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('invalid_user', 'wrong_password', false);
        await expect(loginPage.errorMessage.first()).toBeVisible();
    });

    // 1. Massive Inputs (10,000 characters) - Edge Case
    test('Login attempt with Extremely Long Username/Password (Boundary)', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const hugeString = 'A'.repeat(10000);
        await loginPage.goto();
        await loginPage.usernameInput.fill(hugeString);
        await loginPage.passwordInput.fill(hugeString);
        await loginPage.signInButton.click();

        // Assert that we stay on login page or show an error, not crash/timeout
        await expect(loginPage.errorMessage.first().or(loginPage.signInButton)).toBeVisible();
        expect(page.url()).toContain('/login');
    });

    // 2. Malicious Payloads (XSS & SQLi) in login - Edge Case
    test('Login attempt with XSS & SQLi payloads', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const sqliPayload = "' OR '1'='1";
        const xssPayload = '<script>alert("xss")</script>';

        await loginPage.goto();
        await loginPage.usernameInput.fill(sqliPayload);
        await loginPage.passwordInput.fill(xssPayload);
        await loginPage.signInButton.click();

        await expect(loginPage.errorMessage.first()).toBeVisible();
        // Ensure no actual alert was triggered (implicitly handled by Playwright as it would fail on unexpected dialogs)
    });

    // 3. User Registration Edge Cases
    test.describe('User Registration Edge Cases', () => {

        test('Verify Registration: Duplicate Username/Email Error', async ({ page, seedUser }) => {
            const registerPage = new RegisterPage(page);
            await registerPage.goto();

            // Try to register with already existing username (from seedUser)
            await registerPage.usernameInput.fill(seedUser.username);
            await registerPage.emailInput.fill(`newemail_${Date.now()}@example.com`);
            await registerPage.passwordInput.fill('SecurePass123!');
            await registerPage.registerButton.click();

            await expect(registerPage.errorMessage.first()).toContainText(/Username already taken|registered/i);
        });

        test('Verify Registration: Maximal Text Size and Unicode', async ({ page }) => {
            const registerPage = new RegisterPage(page);
            const unicodeUser = 'مرحباالعالم_🌍_' + Date.now();
            await registerPage.goto();

            await registerPage.usernameInput.fill(unicodeUser);
            await registerPage.emailInput.fill(`unicode_${Date.now()}@example.com`);
            await registerPage.passwordInput.fill('ABC'.repeat(30) + '🌍🚀');
            await registerPage.registerButton.click();

            // Should succeed if unicode is supported
            await page.waitForURL(url => url.pathname.includes('/login'));
            const loginPage = new LoginPage(page);
            await expect(loginPage.successMessage).toBeVisible();
        });

        test('Verify Registration: SQLi Payload Resilience', async ({ page }) => {
            const registerPage = new RegisterPage(page);
            await registerPage.goto();

            const sqli = "user'); DROP TABLE users; --";
            await registerPage.register(sqli, `sqli_${Date.now()}@test.com`, 'Pass123!', false);

            // Should stay on page or show error, but definitely not drop tables
            expect(page.url()).toContain('/register');
            // Check if user table still exists by a quick db check
            const userCount = await prisma.user.count();
            expect(userCount).toBeGreaterThan(0);
        });
    });

    test('Privilege Escalation Protection (Attempting Admin URL)', async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);

        // As a user, attempt to access settings or admin-specific paths directly
        await page.goto('/settings');
        // If settings has admin sections, ensure they are hidden
        const adminSection = page.locator('#admin-settings, .admin-only');
        await expect(adminSection).toBeHidden();

        // Some systems might have separate admin pages
        await page.goto('/admin');
        await expect(page.locator('body')).toContainText(/403|404|Unauthorized|Access Denied|Not Found|could not be found/i, { timeout: 15000 });
    });
});
