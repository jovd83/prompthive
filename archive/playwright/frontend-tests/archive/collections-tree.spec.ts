import { test, expect } from '@playwright/test';

// Generate a random user for isolation
const randomId = Math.random().toString(36).substring(7);
const email = `test.visibility.${randomId}@example.com`;
const password = 'Password123!';

test.describe('Collection Tree Visibility', () => {

    test('should allow toggling collection visibility in settings', async ({ page }) => {
        try {
            console.log('Starting test...');
            // 1. Attempt Register or Login
            await page.goto('/login');
            console.log('Navigated to login');

            // Check if we can register
            const registerLink = page.locator('text=Sign up');
            if (await registerLink.isVisible()) {
                console.log('Registering new user...');
                await registerLink.click();
                await page.fill('input[name="username"]', `User${randomId}`);
                await page.fill('input[name="email"]', email);
                await page.fill('input[name="password"]', password);
                await page.click('button[type="submit"]');
                await page.waitForURL('/');
                console.log('Registration successful');
            } else {
                console.log('Logging in with existing user...');
                await page.fill('input[name="email"]', 'testuser@example.com');
                await page.fill('input[name="password"]', 'password123');
                await page.click('button[type="submit"]');
                await page.waitForURL('/');
                console.log('Login successful');
            }

            // 2. Create a collection to test with
            console.log('Creating collection...');
            await page.goto('/collections');

            // Explicitly wait for the button. It is a Link.
            // But locating by href is safer.
            // Note: href might be relative.
            const newCollBtn = page.locator('a[href="/collections/new"]');
            await expect(newCollBtn).toBeVisible();
            await newCollBtn.click();

            console.log('Filling collection form...');
            await page.fill('input[name="title"]', `Col-${randomId}`);
            await page.click('button:has-text("Create Collection")');

            // Wait for it to appear in the list/sidebar
            console.log('Waiting for collection to appear...');
            await expect(page.locator(`text=Col-${randomId}`)).toBeVisible();
            console.log('Collection created.');

            // 3. Go to settings
            await page.goto('/settings');
            console.log('Navigated to settings');

            // 4. Find the collection in the visibility tree
            // The tree uses the title.
            // The checkbox wrapper is the div with the border.
            // We look for a div that Contains the text, then find the checkbox inside.
            // Need to be careful about nesting.
            // The structure is: div > div.flex.items-center... > div.w-5.h-5 (checkbox) + span (title)

            const row = page.locator('div.flex.items-center.gap-2').filter({ hasText: `Col-${randomId}` }).last();
            // Using last() because outer containers might match?
            // Actually CollectionTree items are specific.

            const checkbox = row.locator('.w-5.h-5');
            await expect(checkbox).toBeVisible();
            // Verify checkmark (svg) is visible (Checked = Visible)
            await expect(checkbox.locator('svg')).toBeVisible();
            console.log('Found collection in settings, initially checked.');

            // 5. Hide it (Uncheck)
            await checkbox.click();
            await expect(checkbox.locator('svg')).toBeHidden();
            console.log('Unchecked collection.');

            // 6. Save settings
            await page.click('button:has-text("Save Visibility Settings")');
            // Wait for success message. It might be a toast or integrated message.
            // The component sets 'message' state.
            await expect(page.locator('text=Saved')).toBeVisible();
            console.log('Settings saved.');

            // 7. Verify it is hidden in Dashboard Sidebar
            // Sidebar links are usually inside <aside> <nav> <a>
            const sidebarLink = page.locator('aside nav a').filter({ hasText: `Col-${randomId}` });
            await expect(sidebarLink).toBeHidden();
            console.log('Verified hidden in sidebar.');

            // 8. Verify hidden in main list
            await page.goto('/collections');
            // In main list, they are links too.
            // locator('main a')
            const treeLink = page.locator('main a').filter({ hasText: `Col-${randomId}` });
            await expect(treeLink).toBeHidden();
            console.log('Verified hidden in main list.');

            // 9. Unhide it
            await page.goto('/settings');
            await checkbox.click();
            // Expect checked
            await expect(checkbox.locator('svg')).toBeVisible();

            await page.click('button:has-text("Save Visibility Settings")');
            await expect(page.locator('text=Saved')).toBeVisible();
            console.log('Unhid collection.');

            // 10. Verify visible again
            await page.goto('/collections');
            await expect(treeLink).toBeVisible();
            console.log('Verified visible in main list.');

        } catch (error) {
            console.error('Test failed:', error);
            // Try to capture screenshot if page is reachable
            try {
                await page.screenshot({ path: 'test-failure.png', fullPage: true });
            } catch (e) {
                console.error('Snapshot failed', e);
            }
            throw error;
        }
    });

});
