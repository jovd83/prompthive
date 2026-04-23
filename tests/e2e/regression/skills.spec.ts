import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';
import { PromptPage } from '../../../pom/PromptPage';

test.describe('Agent Skills - Core Management Features', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('MSS: Create bare minimum Agent Skill from dashboard', async ({ page }) => {
        // Find and click the '+ New Skill' button on the dashboard
        const newSkillButton = page.locator('a[href="/skills/new"]').first();
        await expect(newSkillButton).toBeVisible();
        await newSkillButton.click();

        await page.waitForURL('**/skills/new*');

        // Fill out the unified skill form
        const titleInput = page.locator('input[name="title"]');
        const descriptionInput = page.locator('textarea[name="description"]');
        const repoUrlInput = page.locator('input[name="repoUrl"]');
        const installCommandInput = page.locator('input[name="installCommand"]');
        const submitButton = page.getByRole('button', { name: "Create Skill" });

        const title = `My Agent Skill ${Date.now()}`;

        await page.locator('input[name="url"]').fill('https://github.com/jovd83/mock-skill');
        await titleInput.fill(title);
        await descriptionInput.fill('This is a mock skill created during testing.');
        await installCommandInput.fill('npx -y mock-skill@latest ./');

        await submitButton.click();

        // Verify the PromptDetail view adapted correctly to show it as a Skill
        const titleDisplay = page.getByRole('heading', { name: title }).first();
        await expect(titleDisplay).toBeVisible({ timeout: 15000 });

        const skillBadge = page.getByTitle('Agent Skill').first();
        await expect(skillBadge).toBeVisible();

        // Content/Code box should show the installation command
        const codeBox = page.locator('.font-mono').last();
        await expect(codeBox).toContainText('mock-skill');
    });

    test('MSS: Edit an existing Agent Skill', async ({ page, seedUser }) => {
        // We first need to mock one in the database or simply create one via UI and edit it.
        // Doing the latter for a full end-to-end trace.

        const newSkillButton = page.locator('a[href="/skills/new"]').first();
        await newSkillButton.click();
        await page.waitForURL('**/skills/new*');

        const initialUrl = 'https://github.com/jovd83/edit-skill-test';
        await page.locator('input[name="url"]').fill(initialUrl);
        await page.locator('input[name="title"]').fill('Skill To Edit');
        await page.locator('input[name="installCommand"]').fill('npx -y skill@latest ./');
        await page.getByRole('button', { name: "Create Skill" }).click();

        await expect(page.getByRole('heading', { name: 'Skill To Edit' }).first()).toBeVisible({ timeout: 15000 });

        // Now, we click Edit
        const editButton = page.locator('a[href*="/edit"]').first();
        await expect(editButton).toBeVisible({ timeout: 15000 });
        await editButton.click();

        await page.waitForURL('**/skills/*/edit');

        const newTitle = `Edited Skill ${Date.now()}`;
        const newInstallCmd = 'npx -y edited-skill@latest ./';

        await page.locator('input[name="title"]').fill(newTitle);
        await page.locator('input[name="installCommand"]').fill(newInstallCmd);

        await page.getByRole('button', { name: "Save Skill" }).click();

        await expect(page.getByRole('heading', { name: newTitle }).first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.font-mono').last()).toContainText('edit-skill-test');
    });

    test('MSS: Dashboard distinguishes Skills and Prompts', async ({ page }) => {
        // Use unique titles to avoid shadowing or list collisions
        const dashSkillTitle = `Dashboard Skill ${Date.now()}`;
        const dashPromptTitle = `My Basic Prompt ${Date.now()}`;

        // Create a prompt
        const promptPage = new PromptPage(page);
        await promptPage.gotoCreate();
        await promptPage.createPrompt(dashPromptTitle, 'Basic prompt text');

        await page.goto('/');

        // Create a skill
        await page.locator('a[href="/skills/new"]').first().click();
        await page.waitForURL('**/skills/new*');
        await page.locator('input[name="url"]').fill('https://github.com/jovd83/skill');
        await page.locator('input[name="title"]').fill(dashSkillTitle);
        await page.locator('input[name="installCommand"]').fill('npx skill');
        await page.getByRole('button', { name: "Create Skill" }).click();
        await page.waitForURL('**/skills/*');

        // Navigate to dashboard searching for prompt
        await page.goto(`/?q=${encodeURIComponent(dashPromptTitle)}`);

        // Verify there is a prompt badge inside the prompt card
        const promptCard = page.locator('.card', { hasText: dashPromptTitle }).first();
        await expect(promptCard).toContainText('📝');

        // Navigate to dashboard searching for skill
        await page.goto(`/?q=${encodeURIComponent(dashSkillTitle)}`);
        
        // Verify there is a skill badge inside the skill card
        const skillCard = page.locator('.card', { hasText: dashSkillTitle }).first();
        await expect(skillCard).toBeVisible({ timeout: 15000 });
        await expect(skillCard).toContainText('🤖');
        await expect(skillCard).toContainText('Usage Example');
    });

    test('STABLE MSS: Export and Import an Agent Skill', async ({ page }) => {
        // 1. Create a unique Agent Skill
        const exportSkillTitle = `Exportable Skill ${Date.now()}`;
        const installCmd = `npx -y unique-export-skill@latest ./`;
        const repoUrl = `https://github.com/jovd83/unique-export-skill`;

        await page.goto('/skills/new');

        await page.locator('input[name="url"]').fill(repoUrl);
        await page.locator('input[name="title"]').fill(exportSkillTitle);
        await page.locator('input[name="installCommand"]').fill(installCmd);
        await page.getByRole('button', { name: "Create Skill" }).click();

        await expect(page.getByRole('heading', { name: exportSkillTitle }).first()).toBeVisible({ timeout: 15000 });

        // 2. Export the Database
        await page.goto('/import-export');

        // Wait for tree to load
        await page.waitForTimeout(1000);

        // Start download intercept
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download JSON', exact: true }).click();
        const download = await downloadPromise;
        const exportPath = await download.path();
        expect(exportPath).toBeTruthy();

        // 3. Delete the specific skill to ensure we can actually import it
        await page.goto(`/?q=${encodeURIComponent(exportSkillTitle)}`);
        await page.locator('.card', { hasText: exportSkillTitle }).first().click();
        await page.waitForURL('**/skills/*');
 
         // Delete
         await page.getByRole('button', { name: 'Delete', exact: true }).click();
         await page.getByRole('button', { name: 'Yes', exact: true }).click();
 
         // Wait for redirected or modal to close
         await page.waitForLoadState('networkidle');
 
         // Ensure it's gone from the search results
         await page.goto(`/?q=${encodeURIComponent(exportSkillTitle)}`);
         await page.waitForLoadState('networkidle');
         await expect(page.locator('.card', { hasText: exportSkillTitle })).toHaveCount(0, { timeout: 15000 });

        // 4. Import the file back
        await page.goto('/import-export');

        // We need to set the file path in the input file element
        // The standard import is the first file input
        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(exportPath!);

        await page.getByRole('button', { name: 'Import Prompts', exact: true }).click();

        // Wait for success toast/message showing 'imported'
        await expect(page.getByText(/(Import complete|Importation terminée|terminée|imported|Success)/i)).toBeVisible({ timeout: 45000 });

        // 5. Verify it's back and correctly recognized as a Skill
        await page.goto(`/?q=${encodeURIComponent(exportSkillTitle)}`);
        const skillCard = page.locator('.card', { hasText: exportSkillTitle }).first();
        await expect(skillCard).toBeVisible({ timeout: 15000 });
        await expect(skillCard).toContainText('🤖'); // Just the emoji since we removed texts

        // Click to view details and ensure data was maintained
        await skillCard.click();
        await page.waitForURL('**/skills/*');

        await expect(page.locator('.font-mono').last()).toContainText('unique-export-skill');
        await expect(page.locator('main')).toContainText('🤖');
    });
    test('MSS: Group Import Skills', async ({ page }) => {
        // Go directly to import-export page
        await page.goto('/import-export');

        // Look for the "Group Import Skills" form section
        const groupImportSection = page.locator('.card', { hasText: 'Group Import Skills' });
        await expect(groupImportSection).toBeVisible();

        const urlInput = groupImportSection.locator('textarea');
        const submitBtn = groupImportSection.getByRole('button', { name: 'Import Group Skills' });

        // Fill in some mock git repos
        await urlInput.fill('https://github.com/jovd83/mock-skill-1\nhttps://github.com/jovd83/mock-skill-2');
        await submitBtn.click();

        // Wait for success message
        await expect(groupImportSection.locator('.bg-green-100')).toContainText('Successfully imported 2 skill(s)');

        // Check if collection was created
        await page.goto('/collections');
        // Date format yyyymmdd
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const collectionTitle = `${dateStr}_Skillimport`;
        
        const collectionCard = page.locator('a', { hasText: collectionTitle }).first();
        await expect(collectionCard).toBeVisible();
        
        // Go inside collection
        await collectionCard.click();
        
        // Both skills should be present
        await expect(page.locator('.card', { hasText: 'mock-skill-1' })).toBeVisible();
        await expect(page.locator('.card', { hasText: 'mock-skill-2' })).toBeVisible();
    });
});
