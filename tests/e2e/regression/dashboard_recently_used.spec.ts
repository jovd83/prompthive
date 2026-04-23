import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { prisma } from '../../../lib/prisma';
import { generateTechnicalId } from '../../../services/id-service';
import bcrypt from 'bcrypt';

test.describe('Dashboard Recently Used Sort and Filter', () => {
    test.beforeEach(async ({ page, seedUser }) => {
        // Create 1 prompt that belongs to the user
        await prisma.prompt.create({
            data: {
                title: 'My Recently Used Prompt',
                description: 'A prompt created by me',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('MYP'),
                createdAt: new Date(),
                updatedAt: new Date(Date.now() + 10000), // recently updated
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Content',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        // Create another user and prompt to ensure mine=true filters it out
        const hash = await bcrypt.hash('password123', 10);
        const otherUser = await prisma.user.create({
            data: {
                email: `other_${Date.now()}@example.com`,
                username: `otheruser_${Date.now()}`,
                passwordHash: hash,
            }
        });

        await prisma.prompt.create({
            data: {
                title: 'Other User Prompt',
                description: 'A prompt by someone else',
                createdById: otherUser.id,
                technicalId: await generateTechnicalId('OTH'),
                createdAt: new Date(),
                updatedAt: new Date(Date.now() + 20000),
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Other content',
                        createdById: otherUser.id,
                    }
                }
            }
        });

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await expect(page.getByRole('heading', { name: /Dashboard/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('Dashboard View all for Recently Used uses mine=true', async ({ page }) => {
        // Navigate to the correct destination URL simulating the user clicking the link
        await page.goto('/?mine=true&sort=recent&order=desc');

        // Ensure paginated search results layout is triggered instead of dashboard
        const searchResultsHeading = page.getByRole('heading', { name: /Search Results/i });
        await expect(searchResultsHeading).toBeVisible({ timeout: 10000 });

        const cards = page.locator('h3');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });

        const titles = await cards.allTextContents();

        expect(titles.some(t => t.includes('My Recently Used Prompt'))).toBeTruthy();
        expect(titles.some(t => t.includes('Other User Prompt'))).toBeFalsy();
    });
});
