import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';

test.describe('Mobile Layout & Navigation', () => {
    // Verify responsive behaviors for mobile viewports.

    test.beforeEach(async ({ page, seedUser, isMobile }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);

        console.log(`Test Context: isMobile=${isMobile}, viewport=${JSON.stringify(page.viewportSize())}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    });

    test('Sidebar Toggle on Mobile', async ({ page, isMobile }) => {
        if (!isMobile) {
            console.log('Skipping mobile toggle test on desktop');
            return;
        }

        const sidebar = page.getByTestId('sidebar');
        const backdrop = page.getByTestId('sidebar-backdrop');
        const menuBtn = page.getByTestId('mobile-menu-button');

        // 1. Sidebar should be hidden initially
        await expect(sidebar).toHaveClass(/-translate-x-full/);
        await expect(backdrop).toHaveClass(/opacity-0/);

        // 2. Open Menu
        console.log('Opening mobile menu...');
        await menuBtn.click();

        // 3. Verify Open State
        await expect(sidebar).toHaveClass(/translate-x-0/);
        await expect(backdrop).toHaveClass(/opacity-100/);

        // 4. Close via Close Button
        console.log('Closing menu via X button...');
        await page.getByTestId('sidebar-close-button').click();
        await expect(sidebar).toHaveClass(/-translate-x-full/);
        await expect(backdrop).toHaveClass(/opacity-0/);

        // 5. Open and Close via Backdrop
        console.log('Opening menu again to test backdrop click...');
        await menuBtn.click();
        await expect(sidebar).toHaveClass(/translate-x-0/);
        await expect(backdrop).toHaveClass(/opacity-100/);

        // Click on the right side of the screen (backdrop) to avoid hitting the sidebar
        const viewport = page.viewportSize()!;
        await backdrop.click({ position: { x: viewport.width - 20, y: 300 } });

        await expect(sidebar).toHaveClass(/-translate-x-full/);
        await expect(backdrop).toHaveClass(/opacity-0/);
    });

    test('Sidebar should auto-close on navigation in mobile', async ({ page, isMobile }) => {
        if (!isMobile) return;

        const sidebar = page.getByTestId('sidebar');
        await page.getByTestId('mobile-menu-button').click();
        await expect(sidebar).toHaveClass(/translate-x-0/);

        console.log('Clicking Favorites link in mobile menu...');
        await page.getByRole('link', { name: /Favorites/i }).click();

        // Sidebar should close automatically after navigation trigger
        await expect(sidebar).toHaveClass(/-translate-x-full/);
        await expect(page).toHaveURL(/\/favorites/);
    });

    test('Component visibility based on viewport', async ({ page, isMobile }) => {
        const mobileHeader = page.getByTestId('mobile-header');
        const sidebar = page.getByTestId('sidebar');

        if (isMobile) {
            // Header visible on mobile
            await expect(mobileHeader).toBeVisible();
            // Sidebar starts off-screen (hidden)
            await expect(sidebar).toHaveClass(/-translate-x-full/);
        } else {
            // Header should be hidden on desktop (md:hidden)
            await expect(mobileHeader).toBeHidden();

            // Sidebar should be permanently visible and sticky on desktop
            await expect(sidebar).toBeVisible();
            await expect(sidebar).toHaveClass(/md:sticky/);
            await expect(sidebar).toHaveClass(/md:translate-x-0/);
        }
    });
});
