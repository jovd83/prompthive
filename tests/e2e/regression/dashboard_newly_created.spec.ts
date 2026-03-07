import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { prisma } from '../../../lib/prisma';
import { generateTechnicalId } from '../../../services/id-service';

test.describe('Dashboard Newly Created Sorting', () => {
    test.beforeEach(async ({ page, seedUser }) => {
        // Create 2 prompts with different dates
        await prisma.prompt.create({
            data: {
                title: 'Old Prompt',
                description: 'A prompt created long ago',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('OLD'),
                createdAt: new Date(Date.now() + 10000000), // Slightly in the future
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Content 1',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        await prisma.prompt.create({
            data: {
                title: 'New Prompt',
                description: 'A newly created prompt',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('NEW'),
                createdAt: new Date(Date.now() + 20000000), // Further in the future
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Content 2',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('Dashboard View All newly created sort test', async ({ page }) => {
        await page.goto('/?sort=date&order=desc');

        // Ensure paginated search results layout is triggered instead of dashboard
        const searchResultsHeading = page.getByRole('heading', { name: /Search Results/i });
        await expect(searchResultsHeading).toBeVisible({ timeout: 10000 });

        const cards = page.locator('h3');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });

        const titles = await cards.allTextContents();
        const newPromptIndex = titles.findIndex(t => t.includes('New Prompt'));
        const oldPromptIndex = titles.findIndex(t => t.includes('Old Prompt'));

        expect(newPromptIndex).toBeGreaterThan(-1);
        expect(oldPromptIndex).toBeGreaterThan(-1);
        expect(newPromptIndex).toBeLessThan(oldPromptIndex);
    });
});
