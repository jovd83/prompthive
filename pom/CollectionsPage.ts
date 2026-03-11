import { Page, Locator } from '@playwright/test';

export class CollectionsPage {
    readonly page: Page;

    // Create/Edit
    readonly titleInput: Locator;
    readonly descriptionTextarea: Locator;
    readonly parentSelect: Locator;
    readonly submitButton: Locator;

    // View / Sidebar
    readonly sidebar: Locator;
    readonly collectionHeader: Locator;
    readonly actionsMenuButton: Locator;

    // Actions Menu Items
    readonly editDetailsMenuItem: Locator;
    readonly changeMultipleMenuItem: Locator;
    readonly deleteCollectionMenuItem: Locator;

    // Inline Edit
    readonly inlineNameInput: Locator;
    readonly inlineSaveButton: Locator;

    // Selection Mode
    readonly selectAllButton: Locator;
    readonly selectionBar: Locator;
    readonly closeSelectionModeButton: Locator;

    // Delete Modal
    readonly deleteEverythingButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Create/Edit
        this.titleInput = page.locator('input[name="title"]');
        this.descriptionTextarea = page.locator('textarea[name="description"]');
        this.parentSelect = page.locator('select[name="parentId"]');
        this.submitButton = page.locator('button[type="submit"]');

        // View / Sidebar
        this.sidebar = page.getByTestId('sidebar').first();
        this.collectionHeader = page.locator('h1.truncate');
        this.actionsMenuButton = page.getByTestId('collection-actions-button');

        // Actions Menu Items
        this.editDetailsMenuItem = page.getByText('Edit Details');
        this.changeMultipleMenuItem = page.getByText('Change multiple...');
        this.deleteCollectionMenuItem = page.getByRole('button', { name: /Delete Collection/i });

        // Inline Edit
        this.inlineNameInput = page.locator('input[placeholder="Collection Name"]');
        this.inlineSaveButton = page.getByRole('button', { name: "Save" });

        // Selection Mode
        this.selectAllButton = page.getByTitle('Select All', { exact: true });
        this.selectionBar = page.locator('.bg-primary\\/10');
        this.closeSelectionModeButton = this.selectionBar.locator('button').last();

        // Delete Modal
        this.deleteEverythingButton = page.getByRole('button', { name: /Delete Everything/i });
    }

    async gotoCreate() {
        await this.page.goto('/collections/new');
    }

    async createCollection(title: string, description?: string, parentTitle?: string) {
        if (parentTitle) {
            await this.parentSelect.selectOption({ label: parentTitle });
            // Verify selection
            const val = await this.parentSelect.inputValue();
            if (!val || val === "") {
                throw new Error(`[POM] Failed to select parent collection: ${parentTitle}. Value is still empty.`);
            }
        }
        await this.titleInput.fill(title);
        if (description) {
            await this.descriptionTextarea.fill(description);
        }
        await this.submitButton.click();
    }

    async ensureChildVisible(parentTitle: string, childTitle: string) {
        const child = this.sidebar.getByRole('link', { name: childTitle }).first();
        if (!await child.isVisible()) {
            const parentLink = this.sidebar.getByRole('link', { name: parentTitle }).first();
            const row = parentLink.locator('xpath=./parent::*');
            const toggle = row.getByTestId('collection-toggle');
            if (await toggle.isVisible()) {
                await toggle.click({ force: true });
                // Wait for expansion to complete
                await this.page.waitForTimeout(500);
            }
        }
    }
}
