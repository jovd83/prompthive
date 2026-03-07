import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { SettingsPage } from '../pom/SettingsPage';
import { prisma } from '../../lib/prisma';

test.describe('General Settings Tests (USER role)', () => {
    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(60000);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        // Wait for dashboard or any authenticated element
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 15000 });
    });

    test('Toggle Application Language', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Switch to French
        await settingsPage.languageSelect.selectOption('fr');

        // Verify the UI translates immediately (checking h1 in main for "Paramètres")
        await expect(page.locator('main h1')).toHaveText(/Paramètres/i);

        // Revert to English for safety
        await settingsPage.languageSelect.selectOption('en');
        await expect(page.locator('main h1')).toHaveText(/Settings/i);
    });

    test('Toggle Sidebar Workflows Visibility', async ({ page, isMobile }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // 1. Ensure hidden initially
        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
        }
        await expect(page.locator('a[href="/workflows"]')).toBeHidden();
        if (isMobile) {
            await page.getByTestId('sidebar-close-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'hidden' });
        }

        // 2. Enable Workflows
        await settingsPage.showWorkflowsToggle.click({ force: true });
        await settingsPage.saveGeneralSettings();

        // 3. Verify it appears in sidebar
        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
        }
        await expect(page.locator('nav a[href="/workflows"], .sidebar a[href="/workflows"]')).toBeVisible({ timeout: 10000 });
        if (isMobile) {
            await page.getByTestId('sidebar-close-button').click();
        }

        // 4. Toggle back off
        await settingsPage.goto(); // Return to settings
        await settingsPage.showWorkflowsToggle.click({ force: true });
        await settingsPage.saveGeneralSettings();

        // 5. Verify it disappears
        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
        }
        await expect(page.locator('a[href="/workflows"]')).toBeHidden();
    });
});

test.describe('Admin Settings Tests (ADMIN role)', () => {
    test.beforeEach(async ({ page, seedAdmin }) => {
        test.setTimeout(90000); // Admin tests are heavy
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedAdmin.username, seedAdmin.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 20000 });
    });

    test('Toggle Global Registration Setting', async ({ page, isMobile }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Toggle registration off
        await settingsPage.toggleRegistration(false);
        await page.getByTestId('admin-save-button').click();

        // Verify success message
        await expect(page.getByText(/Settings updated|sauvegardé|succès|success/i)).toBeVisible({ timeout: 10000 });

        // Verify Db updated
        let config = await prisma.globalConfiguration.findUnique({ where: { id: 'GLOBAL' } });
        expect(config?.registrationEnabled).toBe(false);

        // Sign out to test registration page
        if (isMobile) await page.getByTestId('mobile-menu-button').click();
        await page.getByTestId('user-profile-trigger').click();

        // Wait for sign out and catch potential connection issues
        await Promise.all([
            page.waitForURL(url => url.pathname.includes('/login') || url.pathname === '/', { timeout: 20000 }),
            page.getByRole('button', { name: /Sign Out|Déconnexion/i }).click()
        ]);

        // Try to access register page
        await page.goto('/register');
        await page.waitForLoadState('networkidle');

        // Check if we were redirected to login (often the case when disabled)
        const currentPath = new URL(page.url()).pathname;
        if (currentPath === '/register') {
            // If still on register page, attempt to register and check for error message
            await page.getByPlaceholder('username').fill(`test_disabled_${Date.now()}`);
            await page.getByPlaceholder('user@example.com').fill(`test_disabled_${Date.now()}@example.com`);
            await page.getByPlaceholder('Basic password').fill('Password123!');
            await page.getByRole('button', { name: /Submit|Soumettre|Register|S'inscrire/i }).click();

            // Verify disabled message is shown
            const disabledMessage = page.getByText(/Registration is currently disabled|inscription est actuellement désactivée/i, { exact: false });
            await expect(disabledMessage).toBeVisible({ timeout: 10000 });
        } else {
            // If redirected, verify we are back at login and "Sign Up" link is missing/hidden
            expect(currentPath).toContain('login');
            await expect(page.getByRole('link', { name: /Sign Up|S'inscrire/i })).toBeHidden();
        }

        // Re-enable for other tests (Direct DB call since we are signed out)
        await prisma.globalConfiguration.update({
            where: { id: 'GLOBAL' },
            data: { registrationEnabled: true }
        });
    });

    test('Toggle Global Private Prompts Setting', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await settingsPage.goto();

        // Disable Private Prompts
        await settingsPage.togglePrivatePrompts(false);
        await page.getByTestId('admin-save-button').click();
        await expect(page.getByText(/Settings updated|sauvegardé|succès|success/i)).toBeVisible({ timeout: 10000 });

        // Verify it's removed from global config
        let config = await prisma.globalConfiguration.findUnique({ where: { id: 'GLOBAL' } });
        expect(config?.privatePromptsEnabled).toBe(false);

        // Go to create prompt page and ensure toggle is missing
        await page.goto('/prompts/new');
        await page.waitForLoadState('networkidle');
        const privateToggle = page.locator('button[title*="Private"], input[name="isPrivate"]');
        await expect(privateToggle).toBeHidden();

        // Re-enable
        await prisma.globalConfiguration.update({
            where: { id: 'GLOBAL' },
            data: { privatePromptsEnabled: true }
        });
    });
});
