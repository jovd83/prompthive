import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE viewport

    test('should show hamburger menu and toggle sidebar on mobile', async ({ page }) => {
        await page.goto('/');

        // Check if MobileHeader is visible
        const header = page.getByTestId('mobile-header');
        await expect(header).toBeVisible();

        const menuButton = page.getByTestId('mobile-menu-button');
        await expect(menuButton).toBeVisible();

        // Check if Sidebar is initially hidden off-canvas
        const sidebar = page.getByTestId('sidebar');
        // It should have -translate-x-full class or be out of viewport
        await expect(sidebar).toHaveClass(/-translate-x-full/);

        // Click menu button
        await menuButton.click();

        // Sidebar should now be visible (translate-x-0)
        await expect(sidebar).toHaveClass(/translate-x-0/);

        // Check availability of links
        await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

        // Click close button
        const closeButton = page.getByTestId('sidebar-close-button');
        await expect(closeButton).toBeVisible();
        await closeButton.click();

        // Sidebar should be hidden again
        // Wait for animation
        await expect(sidebar).toHaveClass(/-translate-x-full/);
    });

    test('should close sidebar when clicking backdrop', async ({ page }) => {
        await page.goto('/');
        await page.getByTestId('mobile-menu-button').click();

        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar).toHaveClass(/translate-x-0/);

        // Click backdrop
        // The backdrop covering the screen
        const backdrop = page.getByTestId('sidebar-backdrop');
        await expect(backdrop).toBeVisible();

        // Force click because sometimes overlays can be tricky if they animate
        await backdrop.click({ force: true });

        await expect(sidebar).toHaveClass(/-translate-x-full/);
    });
});
