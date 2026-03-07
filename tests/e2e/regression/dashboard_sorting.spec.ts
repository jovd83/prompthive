import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { prisma } from '../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { generateTechnicalId } from '../../../services/id-service';

test.describe('Dashboard Sorting', () => {
    test.beforeEach(async ({ page, seedUser }) => {
        // Create 2 prompts with different view counts
        await prisma.prompt.create({
            data: {
                title: 'Most Viewed Test Prompt',
                description: 'A prompt with many views',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('VIBE'),
                viewCount: 100,
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
                title: 'Least Viewed Test Prompt',
                description: 'A prompt with few views',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('LOW'),
                viewCount: 5,
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

    test('Dashboard View All usage sort test', async ({ page }) => {
        await page.goto('/?sort=usage&order=desc');

        const searchResultsHeading = page.getByRole('heading', { name: /Search Results/i });
        await expect(searchResultsHeading).toBeVisible({ timeout: 10000 });

        const cards = page.locator('h3');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });

        const titles = await cards.allTextContents();
        const mostViewedIndex = titles.findIndex(t => t.includes('Most Viewed Test Prompt'));
        const leastViewedIndex = titles.findIndex(t => t.includes('Least Viewed Test Prompt'));

        expect(mostViewedIndex).toBeGreaterThan(-1);
        expect(leastViewedIndex).toBeGreaterThan(-1);
        expect(mostViewedIndex).toBeLessThan(leastViewedIndex);
    });
});
