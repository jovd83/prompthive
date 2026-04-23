import { Page, Locator, expect } from '@playwright/test';

export class SettingsPage {
    readonly page: Page;

    // Sidebar & Navigation
    readonly settingsLink: Locator;
    readonly systemMenuHeader: Locator;

    // General Settings
    readonly showPromptingTipsToggle: Locator;
    readonly languageSelect: Locator;
    readonly enableTagColorsToggle: Locator;
    readonly showWorkflowsToggle: Locator;

    // User Visibility
    readonly hideUserSelect: Locator;
    readonly hiddenUsersList: Locator;
    readonly saveVisibilityBtn: Locator;

    // Admin Settings
    readonly enableRegistrationToggle: Locator;
    readonly enablePrivatePromptsToggle: Locator;
    readonly addUserButton: Locator;
    readonly userTable: Locator;
    readonly deleteUserConfirmDialog: Locator;
    readonly deleteUserConfirmButton: Locator;
    readonly saveGeneralButton: Locator;
    readonly saveAdminButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Navigation
        this.systemMenuHeader = page.getByTitle(/System/i);
        this.settingsLink = page.locator('a[href="/settings"]').first();

        // General
        this.showPromptingTipsToggle = page.getByTestId('tips-toggle');
        this.languageSelect = page.getByTestId('language-select');
        this.enableTagColorsToggle = page.getByTestId('tag-colors-toggle');
        this.showWorkflowsToggle = page.getByTestId('workflow-toggle');
        this.saveGeneralButton = page.getByTestId('general-save-button');
        this.saveAdminButton = page.getByTestId('admin-save-button');

        // Visibility
        this.hiddenUsersList = page.locator('.card', { hasText: /User Visibility/i });
        this.hideUserSelect = this.hiddenUsersList.locator('.checkbox');
        this.saveVisibilityBtn = page.getByTestId('visibility-save-button');

        // Admin
        this.enableRegistrationToggle = page.locator('#toggle-registration');
        this.enablePrivatePromptsToggle = page.getByTestId('private-prompts-toggle');
        this.addUserButton = page.getByRole('button', { name: /Add User|\+/i });
        this.userTable = page.getByRole('table');
        this.deleteUserConfirmDialog = page.getByRole('dialog').filter({ hasText: /Are you sure/i });
        this.deleteUserConfirmButton = this.deleteUserConfirmDialog.getByRole('button', { name: /Confirm|Delete/i });
    }

    async goto() {
        await this.page.goto('/settings');
    }

    async saveGeneralSettings() {
        await this.saveGeneralButton.click();
        // Wait for success message
        await expect(this.page.getByText(/Settings saved successfully|enregistrés avec succès/i)).toBeVisible();
    }

    async toggleRegistration(enable: boolean) {
        const isChecked = await this.enableRegistrationToggle.isChecked();
        if ((enable && !isChecked) || (!enable && isChecked)) {
            await this.enableRegistrationToggle.locator('xpath=..').click();
        }
    }

    async togglePrivatePrompts(enable: boolean) {
        const isChecked = await this.enablePrivatePromptsToggle.isChecked();
        if ((enable && !isChecked) || (!enable && isChecked)) {
            await this.enablePrivatePromptsToggle.locator('xpath=..').click();
            if (!enable) {
                // Confirm the dialog that appears when disabling private prompts
                const confirmDialog = this.page.getByRole('dialog').filter({ hasText: /hide all private prompts/i });
                await expect(confirmDialog).toBeVisible();
                await confirmDialog.getByRole('button', { name: /Confirm|Disable|Vérifier|Verify/i }).click();
            }
        }
    }
}
