import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';
import { WorkflowsPage } from '../pom/WorkflowsPage';
import { prisma } from '../../lib/prisma';
import { generateTechnicalId } from '../../services/id-service';

test.describe('Advanced Workflows', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        // Create 2 prompts to string together in a workflow
        await prisma.prompt.create({
            data: {
                title: 'Step 1: Idea Generator',
                description: 'Generates ideas',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('Idea'),
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Generate 3 ideas about {{topic}}',
                        variableDefinitions: '{{topic}}',
                        createdById: seedUser.id,
                    }
                }
            }
        });

        await prisma.prompt.create({
            data: {
                title: 'Step 2: Expander',
                description: 'Expands idea',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('Expander'),
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Expand on these ideas: {{ideas}}',
                        variableDefinitions: '{{ideas}}',
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

    test('Create, Edit, Run, and Delete a Workflow', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);

        // 1. Navigate directly to workflows (bypassing side-nav visibility rules)
        await workflowsPage.goto();
        await expect(page.getByRole('heading', { level: 1, name: /Workflows/i })).toBeVisible();

        // 2. Create Workflow
        await workflowsPage.startNewWorkflow();
        await expect(page.getByRole('heading', { level: 1, name: /New Workflow|Nouveau flux/i })).toBeVisible();

        const workflowTitle = `Test Workflow ${Date.now()}`;
        await workflowsPage.titleInput.fill(workflowTitle);
        await workflowsPage.descriptionInput.fill('E2E testing description');
        await workflowsPage.saveWorkflowBtn.click();

        // 3. Edit / Build Workflow
        // Redirects to Edit mode /workflows/[id]/edit after creation
        console.log('Waiting for URL redirection to Edit page...');
        await page.waitForURL(/\/workflows\/.*\/edit/, { timeout: 15000 });
        console.log('On Edit page:', page.url());

        // --- Step Addition Function ---
        const addWorkflowStep = async (promptName: string, expectedCount: number) => {
            console.log(`Adding step: ${promptName}...`);
            let success = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    // 1. Click Add Step
                    await page.getByRole('button', { name: /Add Step/i }).click({ force: true });

                    // 2. Wait for search input
                    const input = page.getByPlaceholder(/Search prompts.../i);
                    await input.waitFor({ state: 'visible', timeout: 3000 });

                    // 3. Search
                    await input.fill(promptName);

                    // 4. Click the match
                    const match = page.locator('button', { hasText: promptName }).first();
                    await match.waitFor({ state: 'visible', timeout: 3000 });
                    await match.click({ force: true });

                    // 5. Verify it appears
                    await expect(page.locator('.card').filter({ hasText: promptName })).toBeVisible({ timeout: 5000 });
                    success = true;
                    console.log(`Successfully added step: ${promptName}`);
                    break;
                } catch (e) {
                    console.log(`Attempt ${attempt} to add "${promptName}" failed. Retrying...`);
                    // Escape search if open
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(1000);
                }
            }
            if (!success) throw new Error(`Failed to add step "${promptName}" after 3 attempts`);
        };

        // Add Step 1
        await addWorkflowStep('Step 1: Idea Generator', 1);

        // Add Step 2
        await addWorkflowStep('Step 2: Expander', 2);

        // Map Output from Step 1 to Step 2
        console.log('Configuring variable mapping (Step 1 Output to Step 2 ideas)...');
        // Wait specifically for the second card to ensure everything is rendered
        const expanderCard = page.locator('.card').filter({ hasText: 'Expander' });
        await expect(expanderCard).toBeVisible({ timeout: 5000 });

        // Find the select for 'ideas'
        const ideasRow = expanderCard.locator('div.grid').filter({ hasText: 'ideas' });
        await ideasRow.locator('select').waitFor({ state: 'visible', timeout: 5000 });

        await ideasRow.locator('select').selectOption('step_index:0');
        console.log('Mapping configured to step_index:0.');

        // Save Workflow Changes
        console.log('Saving workflow...');
        const saveBtn = page.getByRole('button', { name: /Save Workflow|Enregistrer/i });
        await saveBtn.click({ force: true });

        // Wait for 'Saving...' to show and then disappear
        await expect(saveBtn).toBeEnabled({ timeout: 15000 });
        console.log('Workflow saved.');

        // 4. Run Workflow
        console.log('Navigating to run workflow...');
        // Instead of workflowsPage.goto(), let's stay on current page and look for a Run button if it existed,
        // but it doesn't. So we go to list.
        await page.goto('/workflows');
        const card = await workflowsPage.getWorkflowCard(workflowTitle);
        await card.getByRole('link', { name: /Run|Lancer/i }).click();

        await page.waitForURL(/\/workflows\/.*\/run/, { timeout: 15000 });
        await expect(page.getByRole('heading', { level: 1, name: workflowTitle })).toBeVisible();
        console.log('Runner opened.');

        // Fill out required user input (the 'topic' for Step 1)
        console.log('Running Step 1...');
        const topicInput = page.locator('textarea[placeholder*="topic"]');
        await topicInput.waitFor({ state: 'visible' });
        await topicInput.fill('Playwright testing');

        // Ensure prompt compiles correctly
        const compiledPromptArea = page.locator('textarea[readOnly]');
        await expect(compiledPromptArea).toContainText('Generate 3 ideas about Playwright testing');

        // Paste output for Step 1
        console.log('Submitting Step 1 output...');
        await page.locator('textarea[placeholder="Paste response..."]').fill('Idea 1, Idea 2, Idea 3');
        await page.getByRole('button', { name: /Next Step/i }).click();

        // Step 2 should now compile with previous output
        console.log('Running Step 2...');
        await expect(page.getByRole('heading', { level: 2, name: 'Step 2: Expander' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('textarea[readOnly]')).toContainText('Expand on these ideas: Idea 1, Idea 2, Idea 3');

        // Paste output for step 2
        await page.locator('textarea[placeholder="Paste response..."]').fill('Expanded 1... Expanded 2... Expanded 3...');
        await page.getByRole('button', { name: /Finish Workflow/i }).click();

        // Complete screen
        await expect(page.getByText('Workflow Complete', { exact: false })).toBeVisible({ timeout: 15000 });
        console.log('Workflow run completed.');

        // 5. Delete Workflow
        console.log('Deleting workflow...');
        await page.goto('/workflows');
        const wfCard = await workflowsPage.getWorkflowCard(workflowTitle);
        await wfCard.waitFor({ state: 'visible' });

        // Open options dropdown menu (the three dots)
        await wfCard.locator('button').filter({ has: page.locator('svg') }).first().click();

        // Click delete - snapshot shows it's a button with text 'Delete'
        await page.getByRole('button', { name: /Delete|Supprimer/i }).click();

        // Handle confirmation dialog if it appears
        const confirmBtn = page.getByRole('button', { name: /Confirm Delete|Confirm|Yes|Delete/i }).last();
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
            await confirmBtn.click();
        }

        // Wait for it to disappear
        await expect(wfCard).toBeHidden({ timeout: 15000 });
        console.log('Workflow deleted successfully.');
    });
});
