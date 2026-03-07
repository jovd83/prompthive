
import { test, expect } from '@playwright/test';
import { loginUser, promoteUserToAdmin } from './utils';

test.describe('Private Prompts Feature', () => {

    test('Admin can enable private prompts and user can create one', async ({ page }) => {
        // 1. Login and Become Admin
        const { username } = await loginUser(page);
        await promoteUserToAdmin(page);

        // 2. Enable Private Prompts in Global Settings
        await page.goto('/settings');
        // Find the toggle section for Private Prompts
        // We look for the heading and then the checkbox in the same container or nearby
        const privatePromptsSection = page.locator('div').filter({ hasText: 'Private Prompts' }).last();
        // The checkbox is in a label in the same flex container
        const toggle = privatePromptsSection.locator('input[type="checkbox"]').last();

        // If not checked, check it (Enable)
        // Note: AdminSettings defaults are loaded from DB.
        if (!(await toggle.isChecked())) {
            await toggle.check({ force: true });
        }

        // Save Settings
        await page.click('button:has-text("Save")');
        // Wait for success message
        await expect(page.locator('text=Settings saved successfully')).toBeVisible();

        // 3. Create a Private Prompt
        await page.goto('/prompts/new');

        await page.fill('input[name="title"]', 'Top Secret Project');
        await page.fill('textarea[name="description"]', 'This is a private prompt');
        await page.fill('textarea[name="content"]', '{{secret_var}}');

        // Check "Private Prompt" checkbox
        await page.check('input[name="isPrivate"]');

        // Submit
        await page.click('button[type="submit"]');

        // 4. Verify Redirect to Detail Page with Private Badge
        await expect(page).toHaveURL(/\/prompts\//);
        await expect(page.locator('h1')).toContainText('Top Secret Project');

        // Check for Private Badge (exact text match or icon presence)
        // In PromptDetail.tsx: <Lock size={10} /> PRIVATE
        await expect(page.locator('text=PRIVATE')).toBeVisible();
    });
});
