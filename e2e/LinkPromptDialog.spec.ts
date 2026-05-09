import { test, expect, Locator, Page } from '@playwright/test';

export class LinkPromptDialogPOM {
  readonly page: Page;
  readonly dialog: Locator;
  readonly searchInput: Locator;
  readonly linkButtons: Locator;
  readonly cancelButton: Locator;
  readonly noResultsText: Locator;

  constructor(page: Page) {
    this.page = page;
    // Assuming the dialog appears with a dialog role or standard heading
    this.dialog = page.getByRole('dialog');
    this.searchInput = page.getByPlaceholder(/search prompts/i);
    this.linkButtons = page.getByRole('button', { name: /link/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.noResultsText = page.getByText(/no prompts found/i);
  }

  async openDialog() {
    // Navigate to a page that triggers the dialog (assuming /prompts/123)
    await this.page.goto('/prompts/test-id');
    // Trigger action to open dialog
    await this.page.getByRole('button', { name: /link related prompt/i }).click();
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query);
  }
}

test.describe('LinkPromptDialog E2E', () => {
  test('should display search results and allow linking', async ({ page }) => {
    const dialog = new LinkPromptDialogPOM(page);
    
    await dialog.openDialog();
    
    // Web-first assertions
    await expect(dialog.searchInput).toBeVisible();
    
    // Simulate searching
    await dialog.searchFor('example query');
    
    // Wait for debounce and search API call (wait for at least one link button to appear)
    await expect(dialog.linkButtons.first()).toBeVisible({ timeout: 5000 });
    
    // Click the first link button
    await dialog.linkButtons.first().click();
    
    // Ensure the dialog closes
    await expect(dialog.searchInput).toBeHidden();
  });

  test('should show no results when query returns empty', async ({ page }) => {
    const dialog = new LinkPromptDialogPOM(page);
    
    await dialog.openDialog();
    await dialog.searchFor('no-matching-results-xyz');
    
    // Web-first assertion checking for the "No prompts found" text
    await expect(dialog.noResultsText).toBeVisible({ timeout: 5000 });
  });
});
