import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Collections Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should create a root collection', async ({ page }) => {
        const collectionTitle = `Collection ${Date.now()}`;

        await test.step('Navigate to new collection page', async () => {
            // Using the sidebar link or direct navigation
            await page.click('a[title="New Collection"]');
            await expect(page).toHaveURL(/\/collections\/new/);
        });

        await test.step('Fill collection form', async () => {
            await page.fill('input[name="title"]', collectionTitle);
            await page.fill('textarea[name="description"]', 'A test collection');
            // Ensure Root is selected (default)
            // select[name="parentId"] should start with empty string (or not check if not important, but good for validation)
        });

        await test.step('Submit form', async () => {
            await page.click('button[type="submit"]');
            // Wait for redirect to collections list
            await expect(page).toHaveURL(/\/collections/, { timeout: 15000 });
            await page.waitForLoadState('networkidle');
        });

        await test.step('Verify collection exists in sidebar', async () => {
            await page.reload();
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('aside').getByText(collectionTitle)).toBeVisible({ timeout: 10000 });
        });

        await test.step('Verify collection description is visible in detail view', async () => {
            // Click the collection to open details
            await page.locator('aside').getByText(collectionTitle).click();

            // Wait for navigation
            await page.waitForURL(/\/collections\//);

            // Allow hydration
            await page.waitForTimeout(1000);

            // Check if description "A test collection" is visible
            // Detailed selector: Look for P tag that is sibling of H1 inside the header
            await expect(page.locator('h1 + p.text-sm.text-muted-foreground').first()).toHaveText('A test collection');
        });

        await test.step('Edit collection description', async () => {
            // Open Menu
            const menuBtn = page.locator('button:has(svg.lucide-more-vertical)').first();
            await menuBtn.click();

            // Wait for menu to appear and click Edit Details
            const editBtn = page.getByText('Edit Details');
            await editBtn.waitFor({ state: 'visible', timeout: 5000 });
            await editBtn.click();

            // Inputs should appear
            const newDescription = 'Updated description content';
            const descInput = page.locator('textarea[placeholder="Description (optional)"]');
            await descInput.waitFor({ state: 'visible' });
            await descInput.fill(newDescription);

            // Click Save
            await page.getByText('Save').click();

            // Verify new description with retry
            await expect(page.locator('h1 + p.text-sm.text-muted-foreground').first()).toHaveText(newDescription, { timeout: 10000 });
        });
    });

    test('should create a nested collection', async ({ page }) => {
        const parentTitle = `Parent ${Date.now()}`;
        const childTitle = `Child ${Date.now()}`;

        // Create Parent First
        await page.goto('/collections/new');
        await page.fill('input[name="title"]', parentTitle);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/collections/);

        await page.reload(); // Ensure parent appears in query for next step

        // Create Child
        await test.step('Create nested collection', async () => {
            await page.goto('/collections/new');
            await page.fill('input[name="title"]', childTitle);

            // Select the parent
            // We need to match the option by text content (Title)
            const option = await page.locator(`option:has-text("${parentTitle}")`).first();
            const value = await option.getAttribute('value');
            if (value) {
                await page.selectOption('select[name="parentId"]', value);
            } else {
                throw new Error('Parent collection option not found');
            }

            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/\/collections/);
        });

        await test.step('Verify nested structure in sidebar', async () => {
            // Reload to ensure sidebar is updated
            await page.reload();
            await page.waitForLoadState('domcontentloaded');

            // We might need to expand the parent if it's not automatically expanded
            // Target the specific row container
            const parentItem = page.locator('aside div.flex.items-center', { has: page.locator(`text=${parentTitle}`) }).first();

            // Wait for partial re-render if needed
            await page.waitForTimeout(500);

            const expandButton = parentItem.locator('button[aria-label="Toggle children"]');
            if (await expandButton.isVisible()) {
                await expandButton.click();
            }
            await expect(page.locator('aside').getByText(childTitle)).toBeVisible();
        });
    });
});
