import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { SettingsPage } from '../pom/SettingsPage';
import { SearchDiscoveryPage } from '../pom/SearchDiscoveryPage';
import { prisma } from '../../lib/prisma';

test.describe('Admin Management Suite', () => {
    test.beforeAll(async () => {
        await prisma.user.deleteMany();
    });


    test.beforeEach(async ({ page, seedAdmin }) => {
        test.setTimeout(90000); // Admin tests can be slow
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedAdmin.username, seedAdmin.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 20000 });
    });

    test('Scenario 1: Command Palette Admin Integration', async ({ page }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await page.goto('/');

        // 1. Open Palette
        await searchPage.triggerCommandPalette();

        // 2. Verify Admin-only actions are visible (Fallback labels)
        await expect(page.getByRole('option', { name: /Admin Settings|Global Settings|Paramètres globaux/i })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('option', { name: /User Management|Gestion des utilisateurs/i })).toBeVisible({ timeout: 10000 });

        // 3. Navigation Check: User Management
        await page.getByRole('option', { name: /User Management|Gestion des utilisateurs/i }).click();
        await page.waitForURL(/\/settings#users/, { timeout: 15000 });

        // Ensure User Management section is present and expanded if it's collapsible
        await expect(page.locator('#users')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { level: 3, name: /User Management|Gestion des utilisateurs/i })).toBeVisible();
    });

    test('Scenario 2: User Lifecycle Management', async ({ page, isMobile }) => {
        const settingsPage = new SettingsPage(page);
        await page.goto('/settings#users');
        await expect(page.locator('#users')).toBeVisible({ timeout: 10000 });

        const testUser = `admin_test_${Date.now()}`;
        const testEmail = `${testUser}@example.com`;

        // 1. Create a new user
        await page.getByRole('button', { name: /Add User|Ajouter/i }).click();
        await page.getByLabel(/Username|Utilisateur/i).fill(testUser);
        await page.getByLabel(/Email/i).fill(testEmail);
        await page.getByLabel(/Password|Mot de passe/i).fill('Password123!');
        await page.getByRole('button', { name: /Create|Créer/i }).click();

        // Verify success message and visibility in table
        await expect(page.getByText(/User created successfully|Utilisateur créé avec succès/i)).toBeVisible({ timeout: 10000 });

        // 2. Search for the user - Wait for creation to reflect in UI
        const searchInput = page.getByPlaceholder(/Search users|Rechercher des utilisateurs/i);
        await searchInput.fill(testUser);

        // Use a more specific row selector
        const row = page.getByRole('row').filter({ hasText: testUser });
        await expect(row).toBeVisible({ timeout: 15000 });
        console.log(`Successfully found row for ${testUser}`);

        // 3. Toggle Role (USER -> GUEST)
        const roleSelect = row.getByRole('combobox');
        await roleSelect.selectOption('GUEST');

        // Wait for role update success - handle possible variations
        await expect(page.getByText(/User role updated|Rôle de l'utilisateur mis à jour/i)).toBeVisible({ timeout: 15000 });

        // 4. Delete the user
        await page.getByTestId(`delete-user-${testUser}`).click();

        // Confirmation dialog delete button - be more specific
        const confirmButton = page.getByRole('dialog').getByRole('button', { name: /^Delete$|^Supprimer$/i, exact: true });
        await expect(confirmButton).toBeVisible({ timeout: 5000 });
        await confirmButton.click();

        // Verify disappearance
        await expect(row).toBeHidden({ timeout: 15000 });
    });

    test('Scenario 3: Profile and Sign Out via Command Palette', async ({ page }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await page.goto('/');

        await searchPage.triggerCommandPalette();
        await searchPage.commandPaletteInput.fill('Sign Out');

        // Click sign out
        await page.getByRole('option', { name: /Sign Out|Déconnexion/i }).click();

        // Should redirect to login or show signed out state
        await expect(page).toHaveURL(/.*\/login/i, { timeout: 20000 });
        await expect(page.getByRole('button', { name: /Sign In|Se connecter/i })).toBeVisible();
    });

});
