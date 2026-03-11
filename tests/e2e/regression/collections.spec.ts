import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { CollectionsPage } from '../../../pom/CollectionsPage';
import { prisma } from '../../../lib/prisma';

test.describe('Collections Management - Enriched Datasets & Edge Cases', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(90000);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    // 0. Basic Happy Path (MSS) Tests
    test('MSS: Create basic collection', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);
        const title = `Basic Col ${Date.now()}`;

        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(title, 'Basic description');

        await page.waitForURL(/\/collections\/.+/);
        await expect(collectionsPage.collectionHeader).toContainText(title);
    });

    test('MSS: Edit collection', async ({ page, seedUser }) => {
        const collectionsPage = new CollectionsPage(page);
        const title = `Col to Edit ${Date.now()}`;
        const col = await prisma.collection.create({
            data: { title, ownerId: seedUser.id }
        });

        await page.goto(`/collections/${col.id}`);
        await collectionsPage.actionsMenuButton.click();
        await collectionsPage.editDetailsMenuItem.click();

        const newTitle = `Edited ${title}`;
        await collectionsPage.inlineNameInput.fill(newTitle);
        await collectionsPage.inlineSaveButton.click();

        await page.waitForURL(`/collections/${col.id}`);
        await expect(collectionsPage.collectionHeader).toContainText(newTitle);
    });

    test('MSS: Delete collection', async ({ page, seedUser }) => {
        const collectionsPage = new CollectionsPage(page);
        const title = `Col to Delete ${Date.now()}`;
        const coll = await prisma.collection.create({
            data: { title, ownerId: seedUser.id }
        });

        await page.goto(`/collections/${coll.id}`);
        await expect(collectionsPage.collectionHeader).toContainText(title);

        await collectionsPage.actionsMenuButton.click();
        await expect(collectionsPage.deleteCollectionMenuItem).toBeVisible();
        await collectionsPage.deleteCollectionMenuItem.click();
        await expect(collectionsPage.deleteEverythingButton).toBeVisible();
        await collectionsPage.deleteEverythingButton.click();

        await page.waitForURL(url => url.pathname === '/');
        // Check sidebar or main list, avoid toast matches
        const sidebar = page.getByTestId('sidebar').first();
        if (await sidebar.isVisible()) {
            await expect(sidebar).not.toContainText(title);
        } else {
            // Mobile or hidden
            await expect(page.getByText(title)).not.toBeVisible();
        }
    });
    test('Create Collection: 10,000 Character Title & Description (Maximal Stress)', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);
        const hugeTitle = 'T'.repeat(500); // 10k title might fail filesystem/db limits, 500 is safer for title
        const hugeDesc = 'D'.repeat(10000);

        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(hugeTitle, hugeDesc);

        // Expect validation error instead of success
        await expect(page.getByText(/Too big: expected string to have <=100 characters/i)).toBeVisible();
    });

    test('Create Collection: Unicode, Emojis, and RTL (Complex Encoding)', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);
        const complexTitle = 'مجموعة 🌍 👨‍👩‍👧‍👦 ' + Date.now();
        const complexDesc = 'Description with Unicode: 𠜎𠜱𠝹 こんにちは 🌟';

        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(complexTitle, complexDesc);

        await page.waitForURL(/\/collections\/.+/, { timeout: 15000 });
        await expect(collectionsPage.collectionHeader).toContainText('مجموعة');
        await expect(collectionsPage.collectionHeader).toContainText('🌍');
    });

    test('Create Collection: Payload Injection Protection (XSS/SQLi)', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);
        const sqliTitle = "col'); DROP TABLE users; --";
        const xssDesc = '<script>alert("xss")</script> <img src=x onerror=alert(1)>';

        await collectionsPage.gotoCreate();
        await collectionsPage.createCollection(sqliTitle, xssDesc);

        await page.waitForURL(/\/collections\/.+/, { timeout: 15000 });

        // Ensure payloads are rendered as text, not executed
        const descLocator = page.getByTestId('collection-description');
        if (await descLocator.isVisible()) {
            await expect(descLocator).toContainText('<script>');
        }

        // Verify DB integrity
        const userCount = await prisma.user.count();
        expect(userCount).toBeGreaterThan(0);
    });

    test('Access Control: Accessing Private Collection of Another User', async ({ page, seedUser }) => {
        // Create a private collection for another user via Prisma
        const otherUser = await prisma.user.create({
            data: {
                id: `other_user_${Date.now()}`,
                username: `other_${Date.now()}`,
                email: `other_${Date.now()}@test.com`,
                passwordHash: 'dummy'
            }
        });

        const privateCol = await prisma.collection.create({
            data: {
                id: `private_col_${Date.now()}`,
                title: 'Secret Collection',
                ownerId: otherUser.id,
                // Assuming isPrivate field exists or visibility is handled via owner
            }
        });

        const collectionsPage = new CollectionsPage(page);
        await page.goto(`/collections/${privateCol.id}`);

        // Should receive 404/Not Found
        await expect(page.getByRole('heading', { name: /Not Found|Non trouvé/i }).or(page.getByText(/404/))).toBeVisible({ timeout: 15000 });
    });

    test('Stress Test: Rapid Create and Delete Cycle', async ({ page }) => {
        const collectionsPage = new CollectionsPage(page);

        for (let i = 0; i < 3; i++) {
            const title = `Stress ${i} ${Date.now()}`;
            await collectionsPage.gotoCreate();
            await collectionsPage.createCollection(title);
            await page.waitForURL(/\/collections\/.+/, { timeout: 15000 });

            await collectionsPage.actionsMenuButton.click();
            await expect(collectionsPage.deleteCollectionMenuItem).toBeVisible();
            await collectionsPage.deleteCollectionMenuItem.click();
            await expect(collectionsPage.deleteEverythingButton).toBeVisible();
            await collectionsPage.deleteEverythingButton.click();
            await page.waitForURL(url => url.pathname === '/', { timeout: 15000 });
            await page.waitForLoadState('networkidle');
        }

        await expect(page).toHaveURL(/\/\?deletedCollection=.+/);
    });
});
