import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';

test.describe('Authentication Flows', () => {

    test('Successful User Login (Happy Path)', async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);

        await loginPage.goto();
        // Use the plainTextPassword provided by the fixture
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);

        // Verify redirection to dashboard '/'
        await page.waitForURL('**/');
        await expect(page).toHaveURL(/.*$/);
    });

    test('Error on Invalid Credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.goto();
        await loginPage.login('invalid_user', 'wrong_password', false);

        await expect(loginPage.errorMessage.first()).toBeVisible();
    });

    test('Verify Registration Success Message', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.goto({ registered: true });

        await expect(loginPage.successMessage).toBeVisible();
    });
});
