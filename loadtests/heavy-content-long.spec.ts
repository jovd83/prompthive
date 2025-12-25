
import { test, expect } from '@playwright/test';
import { loginUser } from '../frontend-tests/utils';

test('Stress Test: Very long prompt content', async ({ page }) => {
    test.setTimeout(90000);
    await loginUser(page);
    await page.goto('/prompts/new');

    const longText = 'A'.repeat(50000); // 50k chars

    await page.fill('input[name="title"]', 'Long Content Prompt');
    await page.fill('textarea[name="content"]', longText);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/prompts\//, { timeout: 30000 });
    await expect(page.getByText('Long Content Prompt')).toBeVisible();
});
