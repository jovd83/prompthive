import { Page, Locator, expect } from '@playwright/test';

export class DataManagementPage {
    readonly page: Page;
    readonly downloadJsonBtn: Locator;
    readonly exportZeroBtn: Locator;
    readonly importFormBtn: Locator;
    readonly selectJsonInput: Locator;
    readonly zeroSelectAllBtn: Locator;
    readonly includeAttachmentsCheckbox: Locator;
    readonly includeResultsCheckbox: Locator;

    constructor(page: Page) {
        this.page = page;
        this.downloadJsonBtn = page.getByRole('button', { name: /Download JSON|Télécharger JSON/i });
        this.exportZeroBtn = page.getByRole('button', { name: /Export for MyPromptHive Zero|Exporter pour/i });
        this.importFormBtn = page.getByRole('button', { name: /Import Prompts|Importer des Prompts/i }).first();
        this.selectJsonInput = page.locator('input[type="file"][accept=".json"]');
        this.zeroSelectAllBtn = page.locator('.card').filter({ hasText: /Zero/i }).getByRole('button', { name: /Select All|Tout sélectionner/i }).first();
        this.includeAttachmentsCheckbox = page.locator('label').filter({ hasText: /Include Attachments|Bijlagen toevoegen/i }).locator('input[type="checkbox"]');
        this.includeResultsCheckbox = page.locator('label').filter({ hasText: /Include Result Files|Resultaatbestanden/i }).locator('input[type="checkbox"]');
    }

    async goto() {
        await this.page.goto('/import-export');
    }

    async downloadStandardExport() {
        const downloadPromise = this.page.waitForEvent('download');
        await this.downloadJsonBtn.click();
        return await downloadPromise;
    }

    async downloadZeroExport() {
        await this.zeroSelectAllBtn.click();
        const downloadPromise = this.page.waitForEvent('download');
        await this.exportZeroBtn.click();
        return await downloadPromise;
    }

    async importJson(filePath: string) {
        await this.selectJsonInput.setInputFiles(filePath);
        await this.importFormBtn.click();
    }

    async toggleExportOptions(includeAttachments: boolean, includeResults: boolean) {
        const currentAttachments = await this.includeAttachmentsCheckbox.isChecked();
        if (currentAttachments !== includeAttachments) {
            await this.includeAttachmentsCheckbox.click();
        }

        const currentResults = await this.includeResultsCheckbox.isChecked();
        if (currentResults !== includeResults) {
            await this.includeResultsCheckbox.click();
        }
    }
}
