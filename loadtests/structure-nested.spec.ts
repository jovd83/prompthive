
import { test, expect } from '@playwright/test';
import { loginUser } from '../frontend-tests/utils';

test('Stress Test: Nested structures of 10 layers deep', async ({ page }) => {
    test.setTimeout(900000); // 15 mins
    await loginUser(page);

    const uniqueRootId = Math.random().toString(36).substring(7);
    const rootName = `Root Level ${uniqueRootId}`;
    await test.step('1) Create Root Collection', async () => {
        await page.goto('/collections/new');
        await page.fill('input[name="title"]', rootName);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/collections', { timeout: 60000 });
    });

    // 2. Assert Root Exists
    await test.step('2) Assert Root Exists', async () => {
        await expect(page.getByText(rootName).first()).toBeVisible({ timeout: 60000 });
    });

    // 3. Open Root Collection
    await test.step('3) Open Root Collection', async () => {
        await page.getByText(rootName).first().click();
        await expect(page).toHaveURL(/\/collections\/[^\/]+$/, { timeout: 30000 });
    });

    // 4. Iterate 9 times
    for (let i = 2; i <= 10; i++) {
        await test.step(`4.${i - 1}) Create Child Level ${i}`, async () => {
            const currentUrl = page.url();
            const parentId = currentUrl.split('/').pop();

            // Generate truly unique names to avoid collisions in parallel runs
            const uniqueId = Math.random().toString(36).substring(7);
            const parentName = `Parent Collection ${Date.now()}-${uniqueId}`;
            const childName = `Child Collection ${Date.now()}-${uniqueId}`;
            // Create Child Collection by clicking UI button
            await page.getByTitle('New Sub-collection').click();

            // Assure that the parent is the previous one that has been created (selected by default)
            await expect(page.locator('select[name="parentId"]')).toHaveValue(parentId!, { timeout: 30000 });

            await page.fill('input[name="title"]', childName);

            await page.click('button[type="submit"]');

            // Redirects to PARENT collection
            // We use RegExp to match /collections/PARENT_ID
            // Note: need to escape regular expression characters in parentId if any (UUIDs are safe)
            await expect(page).toHaveURL(new RegExp(`/collections/${parentId}$`), { timeout: 60000 });

            // Assert Child Exists (It should be visible in the parent's view)
            await expect(page.getByText(childName).first()).toBeVisible({ timeout: 60000 });

            // Open Child Collection
            await page.getByText(childName).first().click();

            // Verify we are now IN the child (wait for URL to change)
            await expect(page).not.toHaveURL(currentUrl, { timeout: 30000 });
            await expect(page).toHaveURL(/\/collections\/[^\/]+$/, { timeout: 30000 });
        });
    }
});
