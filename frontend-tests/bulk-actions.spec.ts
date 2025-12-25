import { test, expect } from '@playwright/test';
import { loginUser } from './utils';

test.describe('Bulk Actions', () => {
    test.setTimeout(120000);
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should allow selecting multiple prompts and adding tags', async ({ page }) => {
        const timestamp = Date.now();
        const collectionTitle = `Collection ${timestamp}`;
        const prompt1Title = `Prompt A ${timestamp}`;
        const prompt2Title = `Prompt B ${timestamp}`;
        const tagName = `BulkTag${timestamp}`;

        // 1. Create Collection
        await page.goto('/collections/new');
        await page.fill('input[name="title"]', collectionTitle);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/collections/);
        // Find the collection in sidebar and click to go to detail (to get ID)
        await page.reload();
        await page.locator('aside').getByText(collectionTitle, { exact: false }).click();
        await expect(page).toHaveURL(/\/collections\/\w+$/);
        const collectionId = page.url().split('/').pop();
        if (!collectionId || collectionId === 'collections') throw new Error('Invalid collection ID extracted: ' + collectionId);

        // 2. Create Two Prompts
        await page.goto(`/prompts/new?collectionId=${collectionId}`);
        await page.fill('input[name="title"]', prompt1Title);
        await page.fill('textarea[name="content"]', 'Content A');
        await page.click('button[type="submit"]');

        await page.goto(`/prompts/new?collectionId=${collectionId}`);
        await page.fill('input[name="title"]', prompt2Title);
        await page.fill('textarea[name="content"]', 'Content B');
        await page.click('button[type="submit"]');

        // 3. Enable Selection Mode
        await page.goto(`/collections/${collectionId}`);
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('button', { name: 'Collection actions' })).toBeVisible({ timeout: 30000 });
        await page.getByRole('button', { name: 'Collection actions' }).click();
        await page.getByText('Change multiple...', { exact: true }).click();

        // Verify Header
        await expect(page.getByText('Selected')).toBeVisible();
        await expect(page.getByText('Add Tags')).toBeDisabled(); // Should be disabled if 0 selected

        // 4. Select Prompts
        await page.getByRole('heading', { name: prompt1Title, level: 4 }).click();
        // Check visual confirmation (Check icon should appear)
        // We need to target the specific item.
        // We can find the item by text, then look for the check icon inside it.
        await expect(page.locator(`div[data-prompt-id]:has-text("${prompt1Title}")`).locator('svg.lucide-check')).toBeVisible();

        await expect(page.getByText('Add Tags')).toBeEnabled();

        await page.getByRole('heading', { name: prompt2Title, level: 4 }).click();

        // 5. Add Tags
        await page.getByText('Add Tags').click();
        await expect(page.getByText('Add Tags to Selection')).toBeVisible();

        await page.fill('input[placeholder*="Search or create"]', tagName);
        await page.keyboard.press('Enter');

        // Wait for tag to appear in selected list (TagSelector specific)
        await expect(page.locator(`text=${tagName}`).first()).toBeVisible();

        await page.click('button:has-text("Apply Tags")');

        await page.waitForTimeout(2000); // Wait for action
        await expect(page.getByText('Add Tags to Selection')).toBeHidden();

        // Verify Tags
        await expect(page.locator(`text=#${tagName}`).count()).resolves.toBe(2);
    });

    test('should allow bulk moving prompts via drag and drop', async ({ page }) => {
        const timestamp = Date.now();
        const colA = `Col A ${timestamp}`;
        const colB = `Col B ${timestamp}`;
        const p1 = `P1 ${timestamp}`;
        const p2 = `P2 ${timestamp}`;

        // Create Collections
        const createCol = async (title: string) => {
            await page.goto('/collections/new');
            await page.fill('input[name="title"]', title);
            await page.click('button[type="submit"]');
            await page.waitForURL(/\/collections/);
        };

        await createCol(colA);
        await createCol(colB);

        await page.reload();

        // Get IDs
        await page.locator('aside').getByText(colA, { exact: false }).click();
        await page.waitForTimeout(500);
        const idA = page.url().split('/').pop();

        await page.locator('aside').getByText(colB, { exact: false }).click();
        await page.waitForTimeout(500);
        const idB = page.url().split('/').pop();

        // Create Prompts in A
        const createPrompt = async (title: string) => {
            await page.goto(`/prompts/new?collectionId=${idA}`);
            await page.fill('input[name="title"]', title);
            await page.fill('textarea[name="content"]', 'Content');
            await page.click('button[type="submit"]');
            await page.waitForURL(/\/prompts/);
        };

        await createPrompt(p1);
        await createPrompt(p2);

        // Go to A
        await page.goto(`/collections/${idA}`);

        // Enter Selection Mode & Select
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('button', { name: 'Collection actions' })).toBeVisible({ timeout: 30000 });
        await page.getByRole('button', { name: 'Collection actions' }).click();
        await page.getByText('Change multiple...').click();
        await page.getByRole('heading', { name: p1, level: 4 }).click();
        await page.getByRole('heading', { name: p2, level: 4 }).click();

        // Get Prompt IDs from DOM
        const p1Id = await page.locator(`div[data-prompt-id]:has-text("${p1}")`).getAttribute('data-prompt-id');
        const p2Id = await page.locator(`div[data-prompt-id]:has-text("${p2}")`).getAttribute('data-prompt-id');

        if (!p1Id || !p2Id) throw new Error('Could not find prompt IDs');

        const bulkIds = JSON.stringify([p1Id, p2Id]);

        // Drop on Col B in Sidebar
        // Note: Sidebar items are usually 'a' tags or 'div's. CollectionTreeItem renders a 'div' with 'draggable'.
        // We find the element containing the text "Col B timestamp".
        const dropTarget = page.locator('aside').getByText(colB, { exact: false }).locator('xpath=..');
        // Note: getting the parent 'div' might be safer if text is in span/link.
        // CollectionTreeItem structure: div > Link > span.
        // Drop listener is on the outer div.

        await dropTarget.evaluate((node, data) => {
            const dt = new DataTransfer();
            dt.setData('bulkPromptIds', data.ids);
            const event = new DragEvent('drop', {
                bubbles: true,
                cancelable: true,
                dataTransfer: dt
            });
            node.dispatchEvent(event);
        }, { ids: bulkIds });

        await page.waitForTimeout(2000); // Wait for action

        // Verify Move
        await page.goto(`/collections/${idB}`);
        await expect(page.getByText(p1)).toBeVisible();
        await expect(page.getByText(p2)).toBeVisible();

        // Verify Removed from A
        await page.goto(`/collections/${idA}`);
        await expect(page.getByText(p1)).toBeHidden();
        await expect(page.getByText(p2)).toBeHidden();
    });
});
