import { Page, Locator } from '@playwright/test';

export class PromptPage {
    readonly page: Page;

    // Editor page locators
    readonly titleInput: Locator;
    readonly changelogInput: Locator;
    readonly contentTextarea: Locator;
    readonly submitButton: Locator;
    readonly autoAddVariablesBtn: Locator;
    readonly attachmentsToggleBtn: Locator;
    readonly fileInput: Locator;

    // View page locators
    readonly promptTitleDisplay: Locator;
    readonly copyButton: Locator;
    readonly editButton: Locator;
    readonly historyCard: Locator;
    readonly historyRowV1: Locator;
    readonly historyRowV2: Locator;
    readonly restoreV1Button: Locator;
    readonly confirmationDialog: Locator;
    readonly confirmRestoreButton: Locator;
    readonly compareV1Button: Locator;
    readonly lockButton: Locator;
    readonly unlockButton: Locator;
    readonly makePrivateButton: Locator;
    readonly deleteButton: Locator;
    readonly confirmDeleteButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Editor
        this.titleInput = page.locator('input[name="title"]');
        this.changelogInput = page.locator('textarea[name="changelog"]');
        this.contentTextarea = page.locator('textarea[name="content"]');
        this.submitButton = page.locator('button[type="submit"]');
        this.autoAddVariablesBtn = page.locator('button', { hasText: /Auto/i }).first();
        this.attachmentsToggleBtn = page.getByRole('button', { name: /Attachments/i });
        this.fileInput = page.locator('input[type="file"]');

        // View
        this.promptTitleDisplay = page.locator('h1.break-words');
        this.copyButton = page.getByRole('button', { name: /Copy/i }).first();
        this.editButton = page.locator('a[title="Edit"]');
        this.historyCard = page.locator('div.card', { hasText: /History/i });
        this.historyRowV1 = page.locator('.group').filter({ hasText: /Version 1/i }).first();
        this.historyRowV2 = page.locator('.group').filter({ hasText: /Version 2/i }).first();
        this.restoreV1Button = this.historyRowV1.locator('button').nth(1);
        this.confirmationDialog = page.getByTestId('confirmation-dialog');
        this.confirmRestoreButton = this.confirmationDialog.getByRole('button').last();
        this.compareV1Button = this.historyRowV1.locator('button[title*="Compare"]');
        this.lockButton = page.locator('button[title*="Lock"]');
        this.unlockButton = page.locator('button[title*="Unlock"]');
        this.makePrivateButton = page.locator('button[title*="Private"]');
        this.deleteButton = page.getByRole('button', { name: /Delete/i }).first();
        this.confirmDeleteButton = page.getByRole('button', { name: /Yes/i });
    }

    async gotoCreate() {
        await this.page.goto('/prompts/new');
    }

    async gotoView(id: string) {
        await this.page.goto(`/prompts/${id}`);
    }

    async createPrompt(title: string, content: string, attachments?: string[]) {
        await this.titleInput.fill(title);

        if (content) {
            await this.contentTextarea.fill(content);
        }

        if (attachments && attachments.length > 0) {
            await this.attachmentsToggleBtn.click();
            for (const att of attachments) {
                // nth(1) handles the second file input which is usually the visible one in this app's implementation
                await this.fileInput.nth(1).setInputFiles(att);
            }
        }

        await this.page.waitForTimeout(500); // Wait for reactivity
        await this.submitButton.click();
    }
}
