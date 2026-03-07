import { Page, Locator, expect } from '@playwright/test';

export class SearchDiscoveryPage {
    readonly page: Page;
    readonly searchInput: Locator;
    readonly filterToggle: Locator;
    readonly tagsInput: Locator;
    readonly creatorInput: Locator;
    readonly applyFilterBtn: Locator;
    readonly clearFilterBtn: Locator;
    readonly commandPaletteInput: Locator;
    readonly noResultsMessage: Locator;
    readonly resultsHeading: Locator;
    readonly promptCards: Locator;

    constructor(page: Page) {
        this.page = page;
        // Advanced search elements
        this.searchInput = page.locator('input[placeholder*="Search prompts"]').first();
        this.filterToggle = page.getByRole('button', { name: /Toggle filters/i });
        this.tagsInput = page.locator('input[placeholder="coding, writing, seo"]');
        this.creatorInput = page.locator('input[placeholder="admin@example.com"]');
        this.applyFilterBtn = page.locator('button[type="submit"]').filter({ hasText: /(Apply|Appliquer|Filtrer)/i });
        this.clearFilterBtn = page.getByRole('button').filter({ hasText: /(Clear|Effacer)/i });

        // Command palette input. using generic distinct styling of KBarSearch component.
        this.commandPaletteInput = page.getByPlaceholder(/Type a command|commande/i);
        this.noResultsMessage = page.getByText(/No prompts found/i);
        this.resultsHeading = page.locator('h1');
        this.promptCards = page.locator('article');
    }

    async goto() {
        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle');
    }

    async triggerCommandPalette() {
        await this.page.keyboard.press('Control+k');
        await this.page.waitForTimeout(500); // Wait for animation
    }

    async ensureFiltersVisible() {
        const isVisible = await this.tagsInput.isVisible();
        if (!isVisible) {
            await this.filterToggle.click();
        }
    }
}
