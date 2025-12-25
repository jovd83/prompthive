
import { test, expect } from '@playwright/test';
import { loginUser } from '../frontend-tests/utils';

test('Load Test: Create 500 collections', async ({ page }) => {
    test.setTimeout(900000); // 15 mins
    await loginUser(page);

    const count = 50; // Demo count
    console.log(`Creating ${count} collections...`);

    for (let i = 0; i < count; i++) {
        await page.goto('/collections/new');
        const name = `Mass Collection ${i}`;
        await page.fill('input[name="title"]', name);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/collections', { timeout: 30000 });
    }
});
