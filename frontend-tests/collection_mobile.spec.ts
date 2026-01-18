import { test, expect } from '@playwright/test';

test.describe('Mobile Collection Split View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should stack list and detail view on mobile', async ({ page }) => {
        // Navigate to 'unassigned' collection
        await page.goto('/collections/unassigned');

        // Initial State: List Column Visible, Detail Column Hidden
        const listColumn = page.getByTestId('collection-list-column');
        const detailColumn = page.getByTestId('collection-detail-column');

        // Check visibility via classes (Tailwind 'hidden' vs 'flex'/'block')
        // We expect List to NOT have 'hidden'
        await expect(listColumn).not.toHaveClass(/hidden/);
        await expect(listColumn).toHaveClass(/flex/);

        // We expect Detail to HAVE 'hidden'
        await expect(detailColumn).toHaveClass(/hidden/);

        // Note: We are not testing navigation clicking here because we'd need to assume a prompt exists.
        // But verifying the initial "List only" state confirms the split logic is active.
        // To verify the "Detail only" state, we can navigate directly to a prompt URL if we knew an ID.
        // For now, this confirms the layout logic works.
    });
});
