
import { test, expect } from '@playwright/test';

test.describe('Lock Prompt Feature', () => {

    test('should allow creator to lock and unlock prompt', async ({ page }) => {
        // 1. Mock Creator Session
        await page.context().addCookies([{
            name: 'next-auth.session-token',
            value: 'mock-token-creator',
            domain: 'localhost',
            path: '/'
        }]);

        // 2. Mock API to return a prompt created by this user
        await page.route('/api/prompt/p-1', async route => {
            const method = route.request().method();
            if (method === 'GET') {
                await route.fulfill({
                    json: {
                        id: 'p-1',
                        title: 'My Lockable Prompt',
                        createdById: 'u-creator',
                        isLocked: false,
                        versions: [{ id: 'v-1', versionNumber: 1, content: 'test' }],
                        createdBy: { username: 'creator' }
                    }
                });
            } else if (method === 'PATCH') {
                // Mock toggle response
                const postData = route.request().postDataJSON();
                // If locking
                await route.fulfill({ json: { id: 'p-1', isLocked: !postData.isLocked } }); // simplified mock
            }
        });

        // We can't fully mock server actions easily in simple playwright setup without actual backend running.
        // But we can test UI interaction if we mock the page load data or if we use valid session.
        // Assuming dev server is running and we are authenticated.

        // Real E2E:
        // Create a prompt
        await page.goto('/');
        await page.getByText('New Prompt').click();
        await page.getByPlaceholder('e.g. SEO Blog Post Generator').fill('Lock Test');
        await page.locator('.cm-content').fill('Content');
        await page.getByRole('button', { name: 'Create Prompt' }).click();

        // Expect to be on detail page
        await expect(page).toHaveURL(/\/prompts\//);

        // Find Lock button (Open padlock initially)
        const lockBtn = page.locator('button[title="Lock Prompt (Creator Only)"]');
        await expect(lockBtn).toBeVisible();

        // Click to Lock
        await lockBtn.click();

        // Expect icon change
        const unlockBtn = page.locator('button[title="Unlock Prompt (Creator Only)"]');
        await expect(unlockBtn).toBeVisible();

        // Verify Edit is disabled (Even for Creator now)
        const editProps = page.locator('a[title="Locked by creator"]'); // Title changes when locked
        // Or if title is localized string "Locked by creator", wait, the code uses t('detail.actions.lockedByCreator').
        // Let's check for the class indicating disabled state.
        const editBtn = page.getByRole('link').filter({ has: page.locator('svg.lucide-edit') }).first();
        await expect(editBtn).toHaveClass(/opacity-50/);
        await expect(editBtn).toHaveAttribute('href', '#');

        // Click to Unlock
        await unlockBtn.click();
        await expect(lockBtn).toBeVisible();
    });
});
