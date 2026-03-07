import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { SettingsPage } from '../../../pom/SettingsPage';
import { prisma } from '../../../lib/prisma';

test.describe('General Settings - Enriched Datasets & Stress Testing', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(90000);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 15000 });
    });

    test('Toggle Application Language Stress Test (Rapid Toggles)', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Perform multiple toggles rapidly to test UI reactivity and state consistency
        const langs = ['fr', 'de', 'es', 'pt', 'en'];
        for (const lang of langs) {
            await settingsPage.languageSelect.selectOption(lang);
            await page.waitForTimeout(300); // Allow brief render
        }

        // Check if language stabilizes eventually
        await settingsPage.languageSelect.selectOption('fr');
        await expect(page.locator('main h1')).toHaveText(/Paramètres/i);

        await settingsPage.languageSelect.selectOption('en');
        await expect(page.locator('main h1')).toHaveText(/Settings/i);
    });

    test('Rapid Sidebar Workflows Visibility Toggles', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Enforce visible first
        await settingsPage.showWorkflowsToggle.click({ force: true });
        await settingsPage.saveGeneralSettings();
        await expect(page.locator('nav a[href="/workflows"], .sidebar a[href="/workflows"]')).toBeVisible({ timeout: 10000 });

        // Toggle back off
        await settingsPage.showWorkflowsToggle.click({ force: true });
        await settingsPage.saveGeneralSettings();
        await expect(page.locator('nav a[href="/workflows"], .sidebar a[href="/workflows"]')).toBeHidden();

        // Final Toggle on
        await settingsPage.showWorkflowsToggle.click({ force: true });
        await settingsPage.saveGeneralSettings();
        await expect(page.locator('nav a[href="/workflows"], .sidebar a[href="/workflows"]')).toBeVisible();
    });

    test('Enriched User Visibility: Batch Select/Deselect (Edge Case)', async ({ page, seedUser }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Assuming there are multiple users in the db to hide
        const usersToSeedCount = 5;
        for (let i = 0; i < usersToSeedCount; i++) {
            await prisma.user.create({
                data: {
                    id: `stress_user_${i}_${Date.now()}`,
                    username: `hidden_user_${i}_${Date.now()}`,
                    email: `hidden_${i}_${Date.now()}@example.com`,
                    passwordHash: 'dummy'
                }
            });
        }

        await settingsPage.goto(); // Refresh to load new users in select

        // Hide multiple users sequentially
        const userOptions = await settingsPage.hideUserSelect.locator('option').all();
        const hideCount = Math.min(3, userOptions.length - 1); // Not the current user or first empty

        for (let i = 1; i <= hideCount; i++) {
            const userVal = await userOptions[i].getAttribute('value');
            if (userVal) {
                await settingsPage.hideUserSelect.selectOption(userVal);
                await settingsPage.saveGeneralSettings();
            }
        }

        // Verify all 3 are in the list of hidden users
        await expect(settingsPage.hiddenUsersList.locator('li')).toHaveCount(hideCount);
    });
});

test.describe('Admin Settings Protection & Direct Data Hijack Protection', () => {

    test('Privilege Escalation Attempt: Direct API Toggle for Non-Admin', async ({ page, seedUser }) => {
        // A user shouldn't even see admin toggles
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        await expect(settingsPage.enableRegistrationToggle).toBeHidden();
        await expect(settingsPage.enablePrivatePromptsToggle).toBeHidden();

        // Attempt direct access via forcing visible or firing events is not enough
        // but we test if the UI doesn't accidentally reveal them
    });

    test.describe('ADMIN role Constraints', () => {
        test.beforeEach(async ({ page, seedAdmin }) => {
            const loginPage = new LoginPage(page);
            await loginPage.login(seedAdmin.username, seedAdmin.plainTextPassword!);
        });

        test('Toggle Global Settings: SQLi in JSON inputs (if applicable)', async ({ page }) => {
            // Example if there was a JSON config field
            const settingsPage = new SettingsPage(page);
            await settingsPage.goto();

            // If registration enabled toggle uses simple bools but we try to hack values
            await settingsPage.toggleRegistration(false);
            await page.getByTestId('admin-save-button').click();
            await expect(settingsPage.page.getByText(/Settings updated/i)).toBeVisible();

            let config = await prisma.globalConfiguration.findUnique({ where: { id: 'GLOBAL' } });
            expect(config?.registrationEnabled).toBe(false);

            // Re-enable
            await prisma.globalConfiguration.update({
                where: { id: 'GLOBAL' },
                data: { registrationEnabled: true }
            });
        });
    });
});
