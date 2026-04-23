import { Page, Locator } from '@playwright/test';

export class WorkflowsPage {
    readonly page: Page;

    // List Page
    readonly newWorkflowBtn: Locator;
    readonly emptyStateCreateBtn: Locator;

    // New/Edit Form
    readonly titleInput: Locator;
    readonly descriptionInput: Locator;
    readonly saveWorkflowBtn: Locator;

    // Editor Actions
    readonly addStepBtn: Locator;
    readonly promptSearchInput: Locator;

    constructor(page: Page) {
        this.page = page;

        // List Locators
        this.newWorkflowBtn = page.getByRole('link').filter({ hasText: /(New Workflow|Nouveau Flux)/i });
        this.emptyStateCreateBtn = page.getByRole('link', { name: /(Create a Workflow|Créer un flux)/i });

        // Form Locators
        this.titleInput = page.locator('input[name="title"]');
        this.descriptionInput = page.locator('textarea[name="description"]');
        this.saveWorkflowBtn = page.getByRole('button').filter({ hasText: /(Create Workflow|Save Workflow)/i });

        // Editor Locators
        this.addStepBtn = page.getByRole('button').filter({ hasText: /(Add Step|Ajouter une étape)/i });
        this.promptSearchInput = page.getByPlaceholder(/Search prompts/i);
    }

    async goto() {
        await this.page.goto('/workflows');
    }

    async startNewWorkflow() {
        if (await this.emptyStateCreateBtn.isVisible()) {
            await this.emptyStateCreateBtn.click();
        } else {
            await this.newWorkflowBtn.first().click();
        }
    }

    async getWorkflowCard(title: string) {
        return this.page.locator('.card', { hasText: title });
    }
}
