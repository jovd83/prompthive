import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { CollectionsPage } from '../pom/CollectionsPage';
import { prisma } from '../../lib/prisma';

test.describe('Collections Management Epic', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        // Authenticate the user before each test
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('Scenario 1: Create a Collection', async ({ page, isMobile }) => {
        const collectionsPage = new CollectionsPage(page);
        const testTitle = `Col S1 ${Date.now()}`;
        await collectionsPage.gotoCreate();

        await collectionsPage.createCollection(testTitle, 'Description here');

        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible' });
        }
        await expect(collectionsPage.sidebar.getByText(testTitle).first()).toBeVisible({ timeout: 15000 });
    });

    test('Scenario 2: Create a Nested Collection', async ({ page, isMobile }) => {
        const collectionsPage = new CollectionsPage(page);
        const parentTitle = `Parent S2 ${Date.now()}`;
        const childTitle = `Child S2 ${Date.now()}`;

        // Setup: Ensure parent exists
        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(parentTitle);

        await page.waitForURL(url => url.pathname.startsWith('/collections/'), { timeout: 10000 });

        // Now create the child
        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(childTitle, '', parentTitle);

        // Wait for redirect to child collection
        await page.waitForURL(url => url.pathname.startsWith('/collections/') && url.pathname !== '/collections/new', { timeout: 10000 });

        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await page.waitForSelector('[data-testid="sidebar"]', { state: 'visible', timeout: 5000 });
            await collectionsPage.ensureChildVisible(parentTitle, childTitle);
        } else {
            await collectionsPage.ensureChildVisible(parentTitle, childTitle);
        }

        await expect(collectionsPage.sidebar.getByText(childTitle).first()).toBeVisible({ timeout: 15000 });
    });

    test('Scenario 3: Edit Collection Details', async ({ page, isMobile }) => {
        const collectionsPage = new CollectionsPage(page);
        const testTitle = `Col S3 ${Date.now()}`;
        const updatedTitle = `Updated S3 ${Date.now()}`;

        // Setup: Create a collection to edit
        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(testTitle);

        // Wait for redirect to finish
        await page.waitForURL(/\/collections\/.+/, { timeout: 10000 });

        await collectionsPage.actionsMenuButton.click();
        await collectionsPage.editDetailsMenuItem.click();

        await collectionsPage.inlineNameInput.waitFor({ state: 'visible' });
        await collectionsPage.inlineNameInput.fill(updatedTitle);
        await collectionsPage.inlineSaveButton.click();

        await expect(collectionsPage.collectionHeader.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
    });

    test('Scenario 4: Change Multiple (Selection Mode)', async ({ page, isMobile }) => {
        const collectionsPage = new CollectionsPage(page);
        const testTitle = `Col S4 ${Date.now()}`;

        // Setup: Create a collection
        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(testTitle);

        await page.waitForURL(/\/collections\/.+/, { timeout: 10000 });

        await collectionsPage.actionsMenuButton.click();
        await collectionsPage.changeMultipleMenuItem.click();

        await expect(collectionsPage.selectAllButton).toBeVisible({ timeout: 5000 });

        await collectionsPage.closeSelectionModeButton.click();

        await expect(collectionsPage.selectAllButton).toBeHidden();
    });

    test('Scenario 5: Delete Collection', async ({ page, isMobile }) => {
        const collectionsPage = new CollectionsPage(page);
        const testTitle = `Col S5 ${Date.now()}`;

        // Setup: Create a collection to delete
        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(testTitle);

        await page.waitForURL(/\/collections\/.+/, { timeout: 10000 });

        await collectionsPage.actionsMenuButton.click();
        await collectionsPage.deleteCollectionMenuItem.click();

        await collectionsPage.deleteEverythingButton.click();

        // Wait for redirect back to home
        await page.waitForURL(url => url.pathname === '/', { timeout: 10000 });

        if (isMobile) {
            await page.getByTestId('mobile-menu-button').click();
            await expect(collectionsPage.sidebar.getByText(testTitle).first()).toBeHidden({ timeout: 15000 });
        } else {
            await expect(collectionsPage.sidebar.getByText(testTitle)).toBeHidden({ timeout: 15000 });
        }
    });

});
