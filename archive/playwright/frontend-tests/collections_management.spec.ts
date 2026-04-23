import { test, expect, Page } from '@playwright/test';
import { loginUser } from './utils';

test.describe.serial('Collections Management Epic', () => {
    let page: Page;
    let testUser: any;
    const testTitle = `Test Collection ${Date.now()}`;
    const childTitle = `Child Collection ${Date.now()}`;
    const updatedTitle = `Updated Collection ${Date.now()}`;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        testUser = await loginUser(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('Scenario 1: Create a Collection', async () => {
        // Go to new collection
        await page.goto('/collections/new');

        await page.locator('input[name="title"]').fill(testTitle);
        await page.locator('textarea[name="description"]').fill('Description here');
        await page.locator('button[type="submit"]').click();

        // Expect to be redirected to the root collections list or similar
        // Or wait for it to appear in the sidebar
        const sidebar = page.getByTestId('sidebar');

        // wait for the newly created collection to appear
        await expect(sidebar.getByText(testTitle)).toBeVisible({ timeout: 15000 });
    });

    test('Scenario 2: Create a Nested Collection', async () => {
        await page.goto('/collections/new');

        // Select parent
        const parentSelect = page.locator('select[name="parentId"]');
        await parentSelect.selectOption({ label: testTitle });

        await page.locator('input[name="title"]').fill(childTitle);
        await page.locator('button[type="submit"]').click();

        // In the sidebar, the parent might need to be expanded.
        const sidebar = page.getByTestId('sidebar');

        await expect(sidebar.getByText(childTitle)).toBeVisible({ timeout: 15000 });
    });

    test('Scenario 3: Edit Collection Details', async () => {
        // Navigate to the parent collection
        await page.getByTestId('sidebar').getByText(testTitle).click();

        // Wait for URL to update
        await page.waitForURL(/\/collections\/.+/, { timeout: 10000 });

        // Click the context menu dots in the collection header
        await page.getByLabel('Collection actions').click();

        // Click Edit Details
        await page.getByText('Edit Details').click();

        // An input should appear with the old name
        const nameInput = page.locator('input[placeholder="Collection Name"]');
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.fill(updatedTitle);

        // Click Save button
        await page.getByRole('button', { name: "Save" }).click();

        // Wait for the new title to be reflected
        await expect(page.locator('h1').getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
    });

    test('Scenario 4: Change Multiple (Selection Mode)', async () => {
        // From the updatedTitle collection page
        // Click the context menu
        await page.getByLabel('Collection actions').click();

        // Click Change multiple...
        await page.getByText('Change multiple...').click();

        // Wait for Selection Mode
        await expect(page.getByTitle('Select All', { exact: true })).toBeVisible({ timeout: 5000 });

        // Get the close button for selection mode (the X button)
        const selectionBar = page.locator('.bg-primary\\/10');
        await selectionBar.locator('button').last().click();

        // Expect the selection mode controls to disappear
        await expect(page.getByTitle('Select All', { exact: true })).toBeHidden();
    });

    test('Scenario 5: Delete Collection', async () => {
        // We are on updatedTitle collection page
        await page.getByLabel('Collection actions').click();

        await page.getByText('Delete Collection').click();

        // Dialog: 
        // Delete Everything
        await page.getByRole('button', { name: "Delete Everything" }).click();

        // The app redirects to the Dashboard with a URL param when a collection is deleted.
        // Wait for this redirect to occur.
        await page.waitForURL(/\/\?deletedCollection=/, { timeout: 15000 });

        // Ensure the sidebar updates
        await expect(page.getByTestId('sidebar').getByText(updatedTitle)).toBeHidden({ timeout: 15000 });
        await expect(page.getByTestId('sidebar').getByText(childTitle)).toBeHidden({ timeout: 10000 });
    });
});
