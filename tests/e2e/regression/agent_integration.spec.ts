import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { PromptPage } from '../../../pom/PromptPage';
import { prisma } from '../../../lib/prisma';

test.describe('Agent & Agent Skill Integration', () => {
    let skill1Id: string;
    let skill2Id: string;
    let skill1Title: string;
    let skill2Title: string;

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(180000);
        const timestamp = Date.now();
        skill1Title = `Researcher Skill ${timestamp}`;
        skill2Title = `Data Analyst Skill ${timestamp}`;

        // Create some Agent Skills to select from
        const s1 = await prisma.prompt.create({
            data: {
                title: skill1Title,
                itemType: 'AGENT_SKILL',
                description: 'Extracts key facts from text.',
                url: 'https://github.com/jovd83/researcher-skill',
                createdById: seedUser.id,
                versions: {
                    create: {
                        content: 'Expert research logic',
                        versionNumber: 1,
                        createdById: seedUser.id
                    }
                }
            }
        });
        skill1Id = s1.id;

        const s2 = await prisma.prompt.create({
            data: {
                title: skill2Title,
                itemType: 'AGENT_SKILL',
                description: 'Performs statistical analysis.',
                repoUrl: 'https://github.com/jovd83/analyst-skill',
                createdById: seedUser.id,
                versions: {
                    create: {
                        content: 'Regression and Mean analysis',
                        versionNumber: 1,
                        createdById: seedUser.id
                    }
                }
            }
        });
        skill2Id = s2.id;

        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('Create Prompt with Agent Integration', async ({ page }) => {
        const promptPage = new PromptPage(page);
        const title = `Agent Integrated Prompt ${Date.now()}`;
        const content = 'Analyze this data using specialized agents.';
        
        await promptPage.gotoCreate();
        await promptPage.titleInput.fill(title);
        await promptPage.contentTextarea.fill(content);
        
        // Open Agent Options sections
        await page.locator('button:has-text("Use of agents")').first().click();
        await page.locator('button:has-text("Use of agentskills")').first().click();
        
        // Fill Agent Usage
        const agentUsage = 'Invoke Researcher first, then Data Analyst.';
        await page.locator('textarea[name="agentUsage"]').fill(agentUsage);
        
        // Select Skills - use non-exact matching because the label includes description
        await page.getByRole('checkbox', { name: skill1Title }).check();
        await page.getByRole('checkbox', { name: skill2Title }).check();
        
        await promptPage.submitButton.click();
        
        await page.waitForURL('**/prompts/*');
        
        // Verify UI Display
        await expect(page.getByText('Use of agents', { exact: true }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText(agentUsage)).toBeVisible({ timeout: 15000 });
        
        await expect(page.getByText('Use of agentskills', { exact: true }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: new RegExp('^' + skill1Title) })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: new RegExp('^' + skill2Title) })).toBeVisible({ timeout: 15000 });

        // Verify Clipboard
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
        
        // Open Advanced Copy Options
        await page.getByTitle('Advanced Copy Options').click();
        
        // Wait for menu to be visible
        await expect(page.getByRole('button', { name: /Copy Selected/i })).toBeVisible({ timeout: 15000 });
        
        // Check Agents and Agent Skills options explicitly
        await page.getByRole('checkbox', { name: 'Add agents', exact: true }).check();
        await page.getByRole('checkbox', { name: 'Add agentskills' }).check();
        
        // Perform copy
        await page.getByRole('button', { name: /Copy Selected/i }).click();
        
        // Give a moment for the clipboard to be updated
        await page.waitForTimeout(500);
        
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        
        expect(clipboardText).toContain(content);
        expect(clipboardText).toContain('SPECIALIST AGENT');
        expect(clipboardText).toContain('Use if available and materially applicable:');
        expect(clipboardText).toContain(agentUsage);
        expect(clipboardText).toContain(`${skill1Title}: Extracts key facts from text.`);
        expect(clipboardText).toContain(`${skill2Title}: Performs statistical analysis.`);

        // Verify Markdown Download
        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByTitle('Download Markdown').click(),
        ]);
        
        const path = await download.path();
        const fs = require('fs');
        const mdContent = fs.readFileSync(path, 'utf8');
        
        expect(mdContent).toContain('## Agents');
        expect(mdContent).toContain(agentUsage);
        expect(mdContent).toContain('## Agentskills');
        expect(mdContent).toContain('The following agentskills could be used to achieve the goals of this prompt and its tasks');
        expect(mdContent).toContain(`* ${skill1Title}`);
        expect(mdContent).toContain(`** Extracts key facts from text.`);
        expect(mdContent).toContain('** https://github.com/jovd83/researcher-skill');
        expect(mdContent).toContain(`* ${skill2Title}`);
        expect(mdContent).toContain('** https://github.com/jovd83/analyst-skill');
    });

    test('Agent Skill Inheritance in Editor', async ({ page, seedUser }) => {
        // Use the titles generated in beforeEach
        const skill1 = await prisma.prompt.findFirst({ where: { title: skill1Title } });
        const skill2 = await prisma.prompt.findFirst({ where: { title: skill2Title } });

        // Update Researcher Skill (skill1) to link to Analyst Skill (skill2)
        const v1 = await prisma.promptVersion.findFirst({ where: { promptId: skill1!.id } });
        await prisma.promptVersion.update({
            where: { id: v1!.id },
            data: { agentSkillIds: JSON.stringify([skill2!.id]) }
        });

        await page.goto('/prompts/new');
        
        // Wait for Agent Integration section
        await page.getByRole('button', { name: /^Use of agentskills$/ }).first().click();

        // Check Researcher Skill
        await page.getByRole('checkbox', { name: new RegExp('^' + skill1Title) }).check();

        // Analyst Skill should now be checked automatically
        await expect(page.getByRole('checkbox', { name: new RegExp('^' + skill2Title) })).toBeChecked();

        // Should have "inherited from" badge
        await expect(page.getByText(`inherited from ${skill1Title}`)).toBeVisible();

        // Uncheck Researcher Skill
        await page.getByRole('checkbox', { name: new RegExp('^' + skill1Title) }).uncheck();

        // Analyst Skill should be unchecked now
        await expect(page.getByRole('checkbox', { name: new RegExp('^' + skill2Title) })).not.toBeChecked();
    });

    test('Edit Prompt Agent Integration', async ({ page, seedUser }) => {
        const title = `Prompt To Edit ${Date.now()}`;
        const prompt = await prisma.prompt.create({
            data: {
                title,
                createdById: seedUser.id,
                versions: {
                    create: {
                        content: 'Initial content',
                        versionNumber: 1,
                        agentUsage: 'Old usage',
                        agentSkillIds: JSON.stringify([skill1Id]),
                        createdById: seedUser.id
                    }
                }
            }
        });

        await page.goto(`/prompts/${prompt.id}/edit`);
        
        // Expand sections - Using exact regex to avoid strict mode collisions
        // Expand sections if not already expanded
        const addAgentsBtn = page.locator('button:has-text("Use of agents")').first();
        if (await addAgentsBtn.getAttribute('aria-expanded') !== 'true') {
            await addAgentsBtn.click();
        }
        
        const addSkillsBtn = page.locator('button:has-text("Use of agentskills")').first();
        if (await addSkillsBtn.getAttribute('aria-expanded') !== 'true') {
            await addSkillsBtn.click();
        }
        
        // Change Agent Usage
        const newUsage = 'Updated agent instructions.';
        await page.locator('textarea[name="agentUsage"]').fill(newUsage);
        
        // Switch skills - Use Regex to handle text appended to labels
        await page.getByRole('checkbox', { name: new RegExp('^' + skill1Title) }).uncheck();
        await page.getByRole('checkbox', { name: new RegExp('^' + skill2Title) }).check();
        
        // Fill mandatory changelog
        await page.locator('textarea[name="changelog"]').fill('Updated agent integration');

        await page.getByRole('button', { name: /Save Changes|Save Prompt|Enregistrer|Save New Version/i }).click();
        
        await page.waitForURL(`**/prompts/${prompt.id}`);
        
        // Verify
        await expect(page.getByText(newUsage)).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: skill2Title })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('link', { name: skill1Title })).not.toBeVisible();
    });
});
