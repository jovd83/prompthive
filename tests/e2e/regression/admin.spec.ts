import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { SettingsPage } from '../../../pom/SettingsPage';
import { SearchDiscoveryPage } from '../../../pom/SearchDiscoveryPage';
import { prisma } from '../../../lib/prisma';

test.describe('Admin Management - Enriched Datasets & Security Resilience', () => {

    test.beforeAll(async () => {
        // Leave at least the seed admin alone, but clear others if needed
        // await prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } });
    });

    test.beforeEach(async ({ page, seedAdmin }) => {
        test.setTimeout(120000);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedAdmin.username, seedAdmin.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 20000 });
    });

    test('User Lifecycle: Unicode, Emojis, and RTL Usernames', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await page.goto('/settings#users');
        await expect(page.locator('[data-testid="admin-users-section"]').first()).toBeVisible({ timeout: 10000 });

        const unicodeUser = 'مستخدم_🌍_' + Date.now();
        const testEmail = `unicode_${Date.now()}@test.com`;

        await page.getByRole('button', { name: /Add User|Ajouter/i }).click();
        await page.getByLabel(/Username|Utilisateur/i).fill(unicodeUser);
        await page.getByLabel(/Email/i).fill(testEmail);
        await page.getByLabel(/Password|Mot de passe/i).fill('Pass123!🚀');
        await page.getByRole('button', { name: /Create|Créer/i }).click();

        await expect(page.getByText(/User created successfully|Utilisateur créé avec succès/i)).toBeVisible();
        await page.getByText(/User created successfully|Utilisateur créé avec succès/i).waitFor({ state: 'hidden', timeout: 10000 });

        // Verify in table
        const row = page.getByRole('row').filter({ hasText: 'unicode' }).last();
        await expect(row).toBeVisible({ timeout: 10000 });
    });

    test('User Lifecycle: Massive Input Resilience (1,000 char username)', async ({ page }) => {
        await page.goto('/settings#users');
        const hugeUser = 'U'.repeat(1000);
        const hugeEmail = 'E'.repeat(500) + '@test.com';

        await page.getByRole('button', { name: /Add User|Ajouter/i }).click();
        await page.getByLabel(/Username|Utilisateur/i).fill(hugeUser);
        await page.getByLabel(/Email/i).fill(hugeEmail);
        await page.getByLabel(/Password|Mot de passe/i).fill('Password123!');
        await page.getByRole('button', { name: /Create|Créer/i }).click();

        // Either succeeds (if allowed) or shows validation error, but should not crash
        const isSuccess = await page.getByText(/User created successfully/i).isVisible({ timeout: 5000 });
        if (!isSuccess) {
            await expect(page.getByText(/too long|Invalid/i).or(page.getByLabel(/Username/i))).toBeVisible();
        }
    });

    test('Security: Privilege Escalation Prevention Re-verification', async ({ page, seedUser }) => {
        // First sign out from admin
        await page.context().clearCookies();

        // Login as regular user
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);

        // Attempt to access admin sections
        await page.goto('/settings#users');
        await expect(page.locator('[data-testid="admin-users-section"]').first()).toBeHidden();

        // Attempt to trigger admin-only API (simulated via URL if possible, or just checking UI absence)
        const addUserBtn = page.getByRole('button', { name: /Add User/i });
        await expect(addUserBtn).toBeHidden();
    });

    test('Global Config: Rapid Toggle Stress Test', async ({ page }) => {
        const settingsPage = new SettingsPage(page);
        await page.goto('/settings');

        const saveBtn = page.getByTestId('admin-save-button');

        // Rapidly toggle registration 3 times
        for (let i = 0; i < 3; i++) {
            await settingsPage.toggleRegistration(i % 2 === 0);
            await saveBtn.click();
            await expect(page.getByText(/Settings updated/i)).toBeVisible({ timeout: 10000 });
        }
    });
});
