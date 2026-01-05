import { test, expect } from '@playwright/test';
import { loginUser, ensureExpanded } from './utils';

test.describe('Bug Reproduction: Variable Description Duplication', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    test('should display variable description exactly once in view mode', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Var Desc Bug ${timestamp}`;
        const variableName = 'testVar';
        const variableDescription = `Description for ${timestamp}`;

        // 1. Create Prompt
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', `Content with {{${variableName}}}`);

        // Auto Add Variables
        await ensureExpanded(page, 'Variable Definitions (Optional)');
        await page.click('button:has-text("Auto Add Variables")');

        // Fill Description
        // Find the textarea for the variable description. 
        // Based on EditPromptForm.tsx: placeholder="{t('form.labels.variableDesc')}" which maps to "Description" usually?
        // Let's rely on the structure: The variable input is adjacent to the description textarea
        // Or simpler: The variable description textarea has specific placeholder.
        // Looking at EditPromptForm.tsx: placeholder={t('form.labels.variableDesc')}
        // We can just find the second textarea in the repeater row if we want to be robust, or by placeholder if we know it.
        // Let's assume placeholder "Description" or use the layout.

        // Input for key is first, Description is second in the flexibility container.
        // We can target by value? The key input has value "testVar".
        // The description is the textarea next to it.

        const descriptionInput = page.locator('textarea[placeholder="Description"]');
        await descriptionInput.fill(variableDescription);

        await page.click('button[type="submit"]');

        // 2. View Mode
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // 3. Verify Description Count
        // We expect exactly ONE element with this text. 
        // Note: The text might be split if it was duplicated elements.
        const descriptionElements = page.getByText(variableDescription);

        // If the bug exists (duplicate lines), we expect count to be 2.
        // The test passes if count is 1.
        // To properly "Reproduce" (i.e. fail), we expect 1 but we get 2.

        const count = await descriptionElements.count();
        expect(count, `Expected 1 instance of description, found ${count}`).toBe(1);
    });
});
