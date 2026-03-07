import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { DataManagementPage } from '../pom/DataManagementPage';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

test.describe('Data Management: Import & Export', () => {
    let testJsonPath: string;

    test.beforeAll(async () => {
        testJsonPath = path.resolve(__dirname, 'test-import.json');
        const mockPrompt = {
            id: uuidv4(),
            title: "Mock Uploaded Prompt",
            content: "Respond gracefully",
            isPrivate: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const exportObj = {
            version: 2,
            exportedAt: new Date().toISOString(),
            prompts: [mockPrompt],
            definedCollections: []
        };
        fs.writeFileSync(testJsonPath, JSON.stringify(exportObj));
    });

    test.afterAll(async () => {
        if (fs.existsSync(testJsonPath)) {
            fs.unlinkSync(testJsonPath);
        }
    });

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(60000);
        // Seed a collection and prompt
        const collection = await prisma.collection.create({
            data: {
                id: uuidv4(),
                title: "Exportable Collection Test",
                ownerId: seedUser.id,
            }
        });

        await prisma.prompt.create({
            data: {
                title: 'Test Export Prompt',
                createdById: seedUser.id,
                collections: {
                    connect: [{ id: collection.id }]
                },
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Original Content',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 15000 });
    });

    test('Standard JSON Export', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        const download = await dataPage.downloadStandardExport();
        const filename = download.suggestedFilename();
        expect(filename).toContain('.json');

        // Ensure success toast or message appears
        await expect(page.getByText(/Export complete/i)).toBeVisible();
    });

    test('Zero Export', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        const download = await dataPage.downloadZeroExport();
        const filename = download.suggestedFilename();
        expect(filename).toContain('.json');
    });

    test('Data Import', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        await dataPage.importJson(testJsonPath);

        // Verify success message
        await expect(page.getByText(/Import complete|Importation terminée/i)).toBeVisible({ timeout: 15000 });

        // Go to prompts and verify it's there
        await page.goto('/');
        await expect(page.getByText('Mock Uploaded Prompt').first()).toBeVisible();
    });
});
