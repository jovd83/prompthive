import { test, expect } from './fixtures/db-fixture';
import { LoginPage } from '../../../pom/LoginPage';

test.describe('Agent Skills - URL Field Persistence and Display', () => {

    test.beforeEach(async ({ page, seedUser }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
        await page.waitForURL('**/');
    });

    test('MSS: URL field is visible in creation and persists to detail view', async ({ page }) => {
        const title = `Skill with URL ${Date.now()}`;
        const repoUrl = `https://github.com/test/repo-${Date.now()}`;

        // 1. Go to New Skill
        await page.goto('/skills/new');

        // 2. Verify URL field label (which we renamed from GitHub Repository URL)
        // Note: In UnifiedSkillForm we changed it to t('skills.url') || "URL"
        const titleInput = page.locator('input[name="title"]');
        const urlInput = page.locator('input[name="url"]');
        await titleInput.fill(title);
        await urlInput.fill(repoUrl);
        await page.locator('input[name="installCommand"]').fill('npm install test');
        await page.getByRole('button', { name: "Create Skill" }).click();

        // 4. Verify in Detail View
        await expect(page.getByRole('heading', { name: title }).first()).toBeVisible({ timeout: 15000 });

        // Check if "URL" section exists in the "Agent Skill" info pane
        const detailUrlLabel = page.locator('label', { hasText: 'URL' }).filter({ hasText: 'URL' });
        await expect(detailUrlLabel).toBeVisible();

        const detailUrlInput = page.locator('input[readOnly][value="' + repoUrl + '"]');
        await expect(detailUrlInput).toBeVisible();

        // Check if external link button exists
        const externalLink = page.locator('.card', { hasText: 'URL' }).locator('a[href="' + repoUrl + '"]').first();
        await expect(externalLink).toBeVisible();
    });

    test('MSS: URL field is editable', async ({ page }) => {
        const title = `Skill to Edit URL ${Date.now()}`;
        const initialUrl = `https://github.com/initial/url`;
        const editedUrl = `https://github.com/edited/url`;

        // 1. Create
        await page.goto('/skills/new');
        await page.locator('input[name="title"]').fill(title);
        await page.locator('input[name="url"]').fill(initialUrl);
        await page.locator('input[name="installCommand"]').fill('npm install');
        await page.getByRole('button', { name: "Create Skill" }).click();

        // 2. Edit
        await expect(page.getByRole('heading', { name: title }).first()).toBeVisible({ timeout: 15000 });
        const editButton = page.locator('a[href*="/edit"]').first();
        await editButton.click();

        // 3. Update URL
        const urlInput = page.locator('input[name="url"]');
        await urlInput.fill(editedUrl);
        await page.getByRole('button', { name: "Save Skill" }).click();

        // 4. Verify
        await expect(page.getByRole('heading', { name: title }).first()).toBeVisible({ timeout: 15000 });
        const detailUrlInput = page.locator('input[value="' + editedUrl + '"]');
        await expect(detailUrlInput).toBeVisible();
    });
});
