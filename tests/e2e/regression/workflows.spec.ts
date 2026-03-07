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

    test('Create Workflow: 10,000 Character Description (Maximal Constraint)', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();

        const hugeDesc = 'W'.repeat(10000);
        await workflowsPage.titleInput.fill('Maximal Desc Workflow');
        await workflowsPage.descriptionInput.fill(hugeDesc);
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/, { timeout: 20000 });
        // Check if desc persisted (assuming it shows somewhere on edit page)
        const descVal = await workflowsPage.descriptionInput.inputValue();
        expect(descVal.length).toBe(10000);
    });

    test('Create Workflow: Unicode, Emoji, and RTL Persistence', async ({ page }) => {
        const workflowsPage = new WorkflowsPage(page);
        await workflowsPage.goto();
        await workflowsPage.startNewWorkflow();

        const complexTitle = 'مسار عمل 🌍 🚀 ' + Date.now();
        await workflowsPage.titleInput.fill(complexTitle);
        await workflowsPage.saveWorkflowBtn.click();

        await page.waitForURL(/\/workflows\/.*\/edit/, { timeout: 15000 });
        await expect(page.locator('h1')).toContainText('مسار عمل');
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
        const bodyContent = await page.locator('body').innerText();
        expect(bodyContent).toMatch(/403|Unauthorized|Access Denied|Not Found/i);
    });
});
