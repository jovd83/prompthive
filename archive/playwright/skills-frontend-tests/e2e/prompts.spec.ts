import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { PromptPage } from '../pom/PromptPage';
import { prisma } from '../../lib/prisma';

test.describe('Prompt Management', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        // Authenticate the user before each prompt test
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('Create Prompt: Require Content', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoCreate();

        await promptPage.createPrompt('My empty prompt', '');

        // Wait briefly to ensure we do not navigate
        await page.waitForTimeout(1000);
        expect(page.url().includes('/prompts/new')).toBeTruthy();
    });

    test('Create Prompt: Auto-Add Variables Detects Syntaxes', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoCreate();

        await promptPage.titleInput.fill('Variables Prompt');
        await promptPage.contentTextarea.fill('Hello {{name}} and [[age]] !');
        await page.waitForTimeout(500);

        await promptPage.autoAddVariablesBtn.click();

        await expect(page.locator('input[class*="w-[40ch]"]').nth(0)).toHaveValue('name');
        await expect(page.locator('input[class*="w-[40ch]"]').nth(1)).toHaveValue('age');

        await promptPage.submitButton.click();
        await page.waitForURL('**/prompts/*');
    });

    test('Create Prompt: Attachments File Upload', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoCreate();

        // Using a test file from the original test directory
        await promptPage.createPrompt('File Upload Prompt', 'Prompt with an attachment', ['frontend-tests/test_attachment.txt']);

        await page.waitForURL('**/prompts/*');
        await expect(page.getByText('test_attachment.txt').first()).toBeVisible();
    });
});

test.describe('Prompt Views and Interactions', () => {

    let testPromptId: string;

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(60000); // Increase timeout for complex setup
        // Seed a prompt for interactions
        const prompt = await prisma.prompt.create({
            data: {
                title: 'Management Test Prompt',
                description: 'Initial description',
                createdById: seedUser.id,
                isPrivate: false,
                isLocked: false,
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Original Content with {{name}}',
                        createdById: seedUser.id,
                    }
                }
            }
        });
        testPromptId = prompt.id;

        // Ensure global configs are set for features
        await prisma.globalConfiguration.upsert({
            where: { id: 'GLOBAL' },
            update: { privatePromptsEnabled: true, registrationEnabled: true },
            create: { id: 'GLOBAL', privatePromptsEnabled: true, registrationEnabled: true }
        }).catch(() => { });

        // Authenticate the user
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('Metadata and Variable Interaction', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoView(testPromptId);

        await expect(promptPage.promptTitleDisplay).toHaveText('Management Test Prompt');

        const techId = page.locator('span[title="Technical ID"]');
        if (await techId.isVisible()) {
            await expect(techId).not.toBeEmpty();
        }

        await expect(page.getByText('Fill Variables')).toBeVisible();
        await page.locator('textarea[id="name"]').fill('World');

        await promptPage.copyButton.click();
        await expect(page.getByText(/Copied/i)).toBeVisible();
    });

    test('Versioning and Restore', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoView(testPromptId);

        await promptPage.editButton.click();
        await page.waitForURL('**/edit');

        await promptPage.contentTextarea.fill('Updated Content v2');
        await page.locator('textarea[name="changelog"]').fill('Test changelog');
        await promptPage.submitButton.click();

        await page.waitForURL(url => url.pathname === `/prompts/${testPromptId}`);

        await expect(promptPage.historyCard.getByText(/Version 2/i).first()).toBeVisible();
        await expect(page.locator('.bg-background.p-4.rounded-md.font-mono')).toContainText('Updated Content v2');

        await promptPage.restoreV1Button.click();
        await expect(promptPage.confirmationDialog).toBeVisible();
        await promptPage.confirmRestoreButton.click();

        await expect(page.getByText('Version 3')).toBeVisible();
        await expect(page.locator('.bg-background.p-4.rounded-md.font-mono')).toContainText('Original Content');
    });

    test('Lock/Unlock Toggle', async ({ page }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoView(testPromptId);

        await promptPage.lockButton.click();
        await expect(promptPage.unlockButton).toBeVisible();

        const editBtn = page.locator('a[href*="/edit"], a[title*="Locked"]');
        await expect(editBtn).toHaveClass(/opacity-50/);

        await promptPage.unlockButton.click();
        await expect(promptPage.lockButton).toBeVisible();
        await expect(editBtn).not.toHaveClass(/opacity-50/);
    });

    test('Private Prompt Restriction', async ({ page, seedUser }) => {
        const promptPage = new PromptPage(page);
        await promptPage.gotoView(testPromptId);

        await promptPage.makePrivateButton.click();
        await expect(page.locator('.text-purple-600')).toBeVisible();

        // Sign out
        await page.goto('/');
        await page.locator('[data-testid="user-profile-trigger"]').click();
        await page.getByRole('button', { name: /Sign Out/i }).click();
        await page.waitForURL('**/login');

        // Test unauthenticated access redirects to login
        await promptPage.gotoView(testPromptId);
        await page.waitForURL('**/login*');
    });
});
