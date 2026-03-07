import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { DataManagementPage } from '../../../pom/DataManagementPage';
import { prisma } from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

test.describe('Data Management - Enriched Datasets & Error Handling', () => {
    let testJsonPath: string;
    let maliciousJsonPath: string;
    let massiveJsonPath: string;
    let brokenJsonPath: string;

    test.beforeAll(async () => {
        const tempDir = path.resolve(__dirname, 'temp_test_data');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        testJsonPath = path.resolve(tempDir, 'test-import.json');
        maliciousJsonPath = path.resolve(tempDir, 'malicious-import.json');
        massiveJsonPath = path.resolve(tempDir, 'massive-import.json');
        brokenJsonPath = path.resolve(tempDir, 'broken-import.json');

        const basePrompt = {
            id: uuidv4(),
            title: "Mock Uploaded Prompt",
            content: "Respond gracefully",
            isPrivate: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 1. Standard
        fs.writeFileSync(testJsonPath, JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), prompts: [basePrompt], definedCollections: [] }));

        // 2. Malicious (XSS/SQLi)
        const maliciousPrompt = {
            ...basePrompt,
            id: uuidv4(),
            title: "Malicious <script>alert(1)</script>",
            content: "'); DROP TABLE users; --",
        };
        fs.writeFileSync(maliciousJsonPath, JSON.stringify({ version: 2, prompts: [maliciousPrompt], definedCollections: [] }));

        // 3. Massive (10,000+ characters content)
        const massivePrompt = {
            ...basePrompt,
            id: uuidv4(),
            title: "Massive Prompt",
            content: "M".repeat(50000)
        };
        fs.writeFileSync(massiveJsonPath, JSON.stringify({ version: 2, prompts: [massivePrompt], definedCollections: [] }));

        // 4. Broken JSON
        fs.writeFileSync(brokenJsonPath, '{"version": 2, "prompts": [{ "id": "missing-closing-brace"');
    });

    test.afterAll(async () => {
        const tempDir = path.resolve(__dirname, 'temp_test_data');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(120000);
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard|Tableau de Bord/i })).toBeVisible({ timeout: 15000 });
    });

    test('Data Import: Stress Test with Massive JSON (50,000 chars)', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        await dataPage.importJson(massiveJsonPath);
        await expect(page.getByText(/Import complete|Importation terminée/i)).toBeVisible({ timeout: 30000 });

        await page.goto('/');
        await expect(page.getByText('Massive Prompt').first()).toBeVisible();
    });

    test('Data Import: Malicious Payload Injection via JSON', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        await dataPage.importJson(maliciousJsonPath);
        await expect(page.getByText(/Import complete/i)).toBeVisible();

        await page.goto('/');
        await expect(page.getByText('Malicious <script>alert(1)</script>').first()).toBeVisible();

        // Final verify DB still has users
        const count = await prisma.user.count();
        expect(count).toBeGreaterThan(0);
    });

    test('Data Import: Error Resilience on Broken JSON Format', async ({ page }) => {
        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        await dataPage.importJson(brokenJsonPath);

        // Assert error message or toast appears
        await expect(page.getByText(/Invalid JSON|Error|Failed/i)).toBeVisible({ timeout: 10000 });
    });

    test('Data Export: Encoding Check (Unicode/Emoji Persistence)', async ({ page, seedUser }) => {
        // Seed a unicode prompt locally first
        const unicodeCol = await prisma.collection.create({
            data: { id: uuidv4(), title: "Unicode Export 🌍", ownerId: seedUser.id }
        });

        const dataPage = new DataManagementPage(page);
        await dataPage.goto();

        const download = await dataPage.downloadStandardExport();
        const path = await download.path();
        const content = fs.readFileSync(path!, 'utf-8');

        // Check for unicode persistence in exported file
        expect(content).toContain('Unicode Export 🌍');
    });

    test('Access Control: Unauthorized Data Export Attempt', async ({ page }) => {
        // Sign out
        await page.context().clearCookies();
        await page.goto('/import-export');

        // Should redirect to login
        await page.waitForURL('**/login*');
    });
});
