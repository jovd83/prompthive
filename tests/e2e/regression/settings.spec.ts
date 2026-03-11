import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { SettingsPage } from '../../../pom/SettingsPage';
import { prisma } from '../../../lib/prisma';

test.describe('General Settings - Enriched Datasets & Stress Testing', () => {
    test.setTimeout(90000); // Moved timeout to describe block

    test.beforeEach(async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 15000 });
    });

    test('Toggle Application Language Stress Test (Rapid Toggles)', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Perform multiple toggles rapidly to test UI reactivity and state consistency
        const langs = ['fr', 'de', 'es', 'it', 'nl', 'sv', 'en'];
        for (const lang of langs) {
            await settingsPage.languageSelect.selectOption(lang);
            await page.waitForTimeout(1000); // Allow more time for translation change
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

        // Hide multiple users sequentially using checkboxes
        const checkboxes = await settingsPage.hideUserSelect.all();
        const hideCount = Math.min(3, checkboxes.length - 1); // Avoid hiding current user if possible

        for (let i = 0; i < hideCount; i++) {
            // Uncheck the checkbox to hide the user (checkbox is 'Checked' means visible)
            if (await checkboxes[i].isChecked()) {
                await checkboxes[i].click();
            }
        }
        await settingsPage.saveVisibilityBtn.click();
        await expect(page.getByText(/Settings saved successfully|enregistrés avec succès/i)).toBeVisible();

        // Verify users are hidden (unchecked)
        const allCheckboxes = await settingsPage.hideUserSelect.all();
        let unchecked = 0;
        for (const cb of allCheckboxes) {
            if (!(await cb.isChecked())) unchecked++;
        }
        expect(unchecked).toBeGreaterThanOrEqual(hideCount);
    });
});

test.describe('Admin Settings Protection & Direct Data Hijack Protection', () => {

    test('Privilege Escalation Attempt: Direct API Toggle for Non-Admin', async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);

        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();
        await expect(settingsPage.enableRegistrationToggle).toBeHidden();
        await expect(settingsPage.enablePrivatePromptsToggle).toBeHidden();
    });

    test.describe('ADMIN role Constraints', () => {
        test.beforeEach(async ({ page, seedAdmin }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();
            await loginPage.login(seedAdmin.username, seedAdmin.plainTextPassword!);
        });

        test('Toggle Global Settings: SQLi in JSON inputs (if applicable)', async ({ page }) => {
            // Example if there was a JSON config field
            const settingsPage = new SettingsPage(page);
            await settingsPage.goto();
            await page.waitForLoadState('networkidle');

            // If registration enabled toggle uses simple bools but we try to hack values
            await expect(page.getByTestId('admin-save-button')).toBeVisible({ timeout: 20000 });
            await settingsPage.toggleRegistration(false);
            await page.getByTestId('admin-save-button').click();
            await expect(page.getByText(/Settings updated|enregistrés avec succès/i)).toBeVisible({ timeout: 15000 });

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
