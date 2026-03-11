import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { WorkflowsPage } from '../../../pom/WorkflowsPage';
import { prisma } from '../../../lib/prisma';
import { generateTechnicalId } from '../../../services/id-service';

test.describe('Workflows - Enriched Datasets & Error Resilience', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        test.setTimeout(120000);
        // Seed 2 prompts
        await prisma.prompt.create({
            data: {
                title: 'Step 1: Base',
                description: 'Base',
                createdById: seedUser.id,
                technicalId: await generateTechnicalId('Base'),
                versions: {
                    create: {
                        versionNumber: 1,
                        content: 'Start with {{input}}',
                        variableDefinitions: '{{input}}',
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

    // 0. Basic Happy Path (MSS) Tests
    test('MSS: Create basic workflow', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        const title = `Basic WF ${Date.now()}`;

        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();
        await expect(workflowsPage.titleInput).toBeVisible();
        await workflowsPage.titleInput.fill(title);
        await expect(workflowsPage.saveWorkflowBtn).toBeVisible();
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/);
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });

    test('MSS: Edit workflow', async ({ page, seedUser }) => {
        const workflowsPage = new WorkflowsPage(page);
        const title = `WF to Edit ${Date.now()}`;
        const promptTitle = `Base ${Date.now()}`;

        await prisma.prompt.create({
            data: {
                title: promptTitle,
                createdById: (seedUser as any).id,
                versions: { create: { content: 'Content', versionNumber: 1, createdById: (seedUser as any).id } }
            }
        });

        const wf = await prisma.workflow.create({
            data: { title, ownerId: (seedUser as any).id }
        });

        await page.goto(`/workflows/${wf.id}/edit`);

        // Wait for page hydration - use more specific locator for workflow title
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();

        await workflowsPage.addStepBtn.click();
        // Click the prompt in the search list - use specific button match
        await page.getByRole('listitem').getByText(promptTitle, { exact: true }).first().click();

        await workflowsPage.saveWorkflowBtn.click();

        // Wait for persistence - check for step card
        await expect(page.locator('.card', { hasText: promptTitle }).first()).toBeVisible();
    });

    test('MSS: Delete workflow', async ({ page, seedUser }) => {
        const workflowsPage = new WorkflowsPage(page);
        const title = `WF to Delete ${Date.now()}`;
        await prisma.workflow.create({
            data: { title, ownerId: (seedUser as any).id }
        });

        await workflowsPage.goto();
        await workflowsPage.deleteWorkflow(title);
        await expect(page.getByText(title)).not.toBeVisible();
    });

    test('Create Workflow: 10,000 Character Description (Maximal Constraint)', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        const title = `huge_${Date.now()}`;
        const hugeDesc = 'W'.repeat(10000);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();
        await workflowsPage.titleInput.fill(title);
        await workflowsPage.descriptionInput.fill(hugeDesc);
        await workflowsPage.saveWorkflowBtn.click();

        // Redirects to editor - wait for it
        await expect(page).toHaveURL(/.*\/workflows\/.*\/edit/);

        // Go back to list to verify the card and description
        await page.goto('/workflows');
        const card = page.locator('.card', { hasText: title }).first();
        const descText = await card.locator('p').textContent();
        // line-clamp doesn't affect textContent retrieval
        expect(descText?.length).toBe(10000);
    });

    test('Create Workflow: Unicode, Emoji, and RTL Persistence', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();

        const complexTitle = 'مسار عمل 🌍 🚀 ' + Date.now();
        await workflowsPage.titleInput.fill(complexTitle);
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/, { timeout: 15000 });
        await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: 'مسار عمل' })).toBeVisible();
    });

    test('Create Workflow: Payload Injection Resilience (XSS/SQLi)', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();

        const xssTitle = 'WF <script>alert(1)</script>';
        const sqliDesc = "'); DELETE FROM Workflows; --";

        await workflowsPage.titleInput.fill(xssTitle);
        await workflowsPage.descriptionInput.fill(sqliDesc);
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/, { timeout: 15000 });

        // Final verify DB still has workflows
        const count = await prisma.workflow.count();
        expect(count).toBeGreaterThan(0);
    });

    test('Workflow Execution: Broken Variable Mapping Resilience', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();
        await workflowsPage.titleInput.fill('Broken Map Test');
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/);

        // Add step 
        await page.getByRole('button', { name: /Add Step/i }).click();
        await page.getByPlaceholder(/Search prompts/i).fill('Step 1: Base');
        await page.locator('button', { hasText: 'Step 1: Base' }).first().click();

        // Intentionally NOT mapping variables or mapping to non-existent index if possible
        // but here we just test if runner handles missing inputs gracefully
        await workflowsPage.saveWorkflowBtn.click();

        await page.goto('/workflows');
        const card = await workflowsPage.getWorkflowCard('Broken Map Test');
        await card.getByRole('link', { name: /Run/i }).click();

        // Runner should still load and show the input field for 'input'
        await expect(page.locator('textarea[placeholder*="input"]')).toBeVisible();
    });

    test('Access Control: Accessing Private Workflow of Another User', async ({ page, seedUser }) => {
        const otherUser = await prisma.user.create({
            data: {
                id: `wf_other_${Date.now()}`,
                username: `wf_other_${Date.now()}`,
                email: `wf_other_${Date.now()}@test.com`,
                passwordHash: 'dummy'
            }
        });

        const privateWF = await prisma.workflow.create({
            data: {
                id: `private_wf_${Date.now()}`,
                title: 'Secret Workflow',
                ownerId: otherUser.id,
                // published: false by default usually
            }
        });

        await page.goto(`/workflows/${privateWF.id}/run`);
        await expect(page.locator('body')).toContainText(/403|404|Unauthorized|Access Denied|Not Found|could not be found/i, { timeout: 15000 });
    });
});
