import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { SearchDiscoveryPage } from '../pom/SearchDiscoveryPage';
import { prisma } from '../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { generateTechnicalId } from '../../services/id-service';

test.describe('Search and Discovery', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        // Prepare some data
        const marketingCol = await prisma.collection.create({
            data: { id: uuidv4(), title: 'Marketing', ownerId: seedUser.id }
        });

        const tagSEO = await prisma.tag.upsert({
            where: { name: 'SEO' },
            update: {},
            create: { name: 'SEO', color: 'blue' }
        });

        const techId1 = await generateTechnicalId(marketingCol.title);

        await prisma.prompt.create({
            data: {
                title: 'SEO Keywords',
                description: 'A prompt for SEO',
                createdById: seedUser.id,
                technicalId: techId1,
                collections: { connect: [{ id: marketingCol.id }] },
                tags: { connect: [{ id: tagSEO.id }] },
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Generate keywords for {{topic}}',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        await prisma.prompt.create({
            data: {
                title: 'Playwright Testing Guide',
                description: 'Test everything',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('QA'),
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'How to write playwright tests',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible({ timeout: 15000 });
    });

    test('Search by Keyword and Technical ID', async ({ page, seedUser }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await searchPage.goto();

        const prompt = await prisma.prompt.findFirst({
            where: { title: 'SEO Keywords', createdById: seedUser.id }
        });

        // 1. Keyword search
        await searchPage.searchInput.fill('Playwright');
        await searchPage.searchInput.press('Enter');
        await page.waitForURL(/q=Playwright/, { timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Playwright Testing Guide' }).first()).toBeVisible();
        await expect(page.getByRole('heading', { name: 'SEO Keywords' }).first()).not.toBeVisible();

        // 2. Technical ID search
        await searchPage.searchInput.fill(prompt?.technicalId as string);
        await searchPage.searchInput.press('Enter');
        await page.waitForURL(new RegExp(`q=${prompt?.technicalId}`), { timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'SEO Keywords' }).first()).toBeVisible();
    });

    test('Advanced Search: Filter by Tags and Creator', async ({ page, seedUser }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await searchPage.goto();

        // 1. Tag filtering
        await searchPage.ensureFiltersVisible();
        await searchPage.tagsInput.fill('SEO');
        await searchPage.applyFilterBtn.click();
        await page.waitForURL(/tags=SEO/, { timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'SEO Keywords' }).first()).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Playwright Testing Guide' }).first()).not.toBeVisible();

        // 2. Creator filtering (using email)
        await searchPage.ensureFiltersVisible();
        await searchPage.tagsInput.fill(''); // Clear tags
        await searchPage.creatorInput.fill(seedUser.email);
        await searchPage.applyFilterBtn.click();
        await page.waitForURL(new RegExp(`creator=${encodeURIComponent(seedUser.email)}`), { timeout: 10000 });

        const results = await page.getByRole('heading', { level: 3 }).allTextContents();
        expect(results.some(r => r.includes('SEO Keywords'))).toBeTruthy();
        expect(results.some(r => r.includes('Playwright Testing Guide'))).toBeTruthy();
    });

    test('Search: No Results found', async ({ page }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await searchPage.goto();

        await searchPage.searchInput.fill('NonExistentPromptXYZ123');
        await searchPage.searchInput.press('Enter');
        await expect(searchPage.noResultsMessage).toBeVisible({ timeout: 10000 });
    });

    test('Command Palette: Theme Toggle, Navigation, and Quick Actions', async ({ page }) => {
        const searchPage = new SearchDiscoveryPage(page);
        await searchPage.goto();

        // 1. Theme Toggle
        const html = page.locator('html');
        const initialClass = await html.getAttribute('class') || '';
        const isDarkInitially = initialClass.includes('dark');

        await searchPage.triggerCommandPalette();
        await searchPage.commandPaletteInput.fill('Theme');
        await page.getByRole('option', { name: /(Theme|Thème|Thema)/i }).first().click();

        await expect(async () => {
            const currentClass = await html.getAttribute('class') || '';
            const isDarkNow = currentClass.includes('dark');
            expect(isDarkNow).toBe(!isDarkInitially);
        }).toPass({ timeout: 5000 });

        // 2. Navigation (Settings)
        await searchPage.triggerCommandPalette();
        await searchPage.commandPaletteInput.fill('Settings');
        await page.getByRole('option', { name: /(Settings|Instellingen|Paramètres)/i }).first().click();
        await page.waitForURL(/\/settings$/, { timeout: 10000 });
        await expect(page.getByRole('heading', { level: 1, name: /Settings|Paramètres/i })).toBeVisible();

        // 3. Navigation (Help)
        await searchPage.triggerCommandPalette();
        await searchPage.commandPaletteInput.fill('Help');
        await page.getByRole('option', { name: /(Help|Aide|Hulp)/i }).first().click();
        await page.waitForURL(/\/help$/, { timeout: 10000 });
        await expect(page.getByRole('heading', { level: 1, name: /Help|Aide|Assistance/i })).toBeVisible();

        // 4. Quick Action (Create Prompt)
        await searchPage.triggerCommandPalette();
        await searchPage.commandPaletteInput.fill('Create Prompt');
        await page.getByRole('option', { name: /(Create Prompt|Créer un prompt)/i }).first().click();
        await page.waitForURL(/\/prompts\/new$/, { timeout: 10000 });
        await expect(page.getByRole('heading', { level: 1, name: /New Prompt|Nouveau prompt/i })).toBeVisible();
    });

    test('Technical ID URL Resolution', async ({ page, seedUser }) => {
        const prompt = await prisma.prompt.findFirst({
            where: { title: 'SEO Keywords', createdById: seedUser.id }
        });

        await page.goto(`/prompts/${prompt?.technicalId}`);
        await expect(page.getByRole('heading', { name: 'SEO Keywords' })).toBeVisible({ timeout: 15000 });
        expect(page.url()).toContain(prompt?.technicalId as string);
    });
});
