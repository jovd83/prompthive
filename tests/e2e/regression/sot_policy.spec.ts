
import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { PromptPage } from '../../../pom/PromptPage';
import { prisma } from '../../../lib/prisma';

test.describe('Source-of-Truth Copy Policy', () => {
    test.beforeEach(async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('Copy with SOT Policy appends policy text and shows success message', async ({ page, seedUser }) => {
        const title = `SOT Policy Prompt ${Date.now()}`;
        const content = 'This is the main prompt content.';
        const prompt = await prisma.prompt.create({
            data: {
                title,
                createdById: seedUser.id,
                versions: {
                    create: {
                        content,
                        versionNumber: 1,
                        createdById: seedUser.id
                    }
                }
            }
        });

        await page.goto(`/prompts/${prompt.id}`);
        
        // Ensure buttons are visible
        const copyBtn = page.getByRole('button', { name: /^Copy Prompt$/i });
        const advancedToggle = page.getByTitle(/Advanced Copy Options/i);
        
        await expect(copyBtn).toBeVisible();
        await expect(advancedToggle).toBeVisible();

        // Grant clipboard permissions
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

        // Test normal copy
        await copyBtn.click();
        await expect(page.getByText(/Copied!/i)).toBeVisible();
        let clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText.trim()).toBe(content);
        expect(clipboardText).not.toContain('STRICT SOURCE-OF-TRUTH POLICY');

        // Test SOT copy via Advanced Menu
        await advancedToggle.click();
        
        const sotCheckbox = page.locator('label').filter({ hasText: /source-of-truth/i }).locator('input[type="checkbox"]');
        await expect(sotCheckbox).toBeVisible();
        await sotCheckbox.check();

        const copySelectedBtn = page.getByRole('button', { name: /Copy Selected/i });
        await copySelectedBtn.click();

        await expect(page.getByText(/Copied!/i)).toBeVisible();
        
        clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toContain(content);
        expect(clipboardText).toContain('SOURCE-OF-TRUTH CHECK');
        expect(clipboardText).toContain('Do not treat training knowledge');
    });
});
