import { test, expect } from '@playwright/test';
import { loginUser, ensureExpanded } from './utils';

test.describe('Prompt Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginUser(page);
    });

    // 1. Mandatory Fields Only
    test('should create a prompt with ONLY mandatory fields', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Mandatory Prompt ${timestamp}`;
        const promptContent = 'Simple content';

        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', promptContent);

        // Wait for button to be enabled/clickable
        const submitBtn = page.locator('button[type="submit"]');
        await expect(submitBtn).toBeEnabled();
        await submitBtn.click();

        // Assertions on Detail Page
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });
        await expect(page.locator('main h1')).toHaveText(promptTitle);
        await expect(page.locator('text=Simple content')).toBeVisible();
    });

    // 2. All Meta Fields (Collection, Tags, Description)
    test('should create a prompt with collection, tags, and description', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Meta Prompt ${timestamp}`;
        const description = 'Detailed description';
        const tagName = `Tag${timestamp}`;

        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Content');
        await page.fill('textarea[name="description"]', description);

        // Add Tag - Wait for selector
        const tagInput = page.locator('input[placeholder="Select or create tags..."]');
        await expect(tagInput).toBeVisible();
        await tagInput.fill(tagName);
        // Wait for the "Create" option to appear in the dropdown and click it
        // The dropdown usually has a generic selector, we look for text "Create "Tag...""
        // Adjust dependent on how TagSelector renders the create option.
        // Assuming it says 'Create tag "tagName"'
        await page.click(`text=Create tag "${tagName}"`);

        // Wait for tag to appear as selected (TagSelector pills do not have # prefix)
        await expect(page.locator(`span:has-text("${tagName}")`)).toBeVisible();

        await page.click('button[type="submit"]');

        // Assertions
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });
        await expect(page.locator('main h1')).toHaveText(promptTitle);
        await expect(page.getByText(description)).toBeVisible();
        await expect(page.getByText(tagName).first()).toBeVisible();
    });



    // 3. Detailed Logic (Variables, Long Content, Usage)
    test.skip('should create a prompt with variables, long content, and usage example', async ({ page }) => {
        const promptTitle = `Logic Prompt ${Date.now()}`;

        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Hello {{name}}');

        // Auto Add Variables (Variables section is default open, but let's ensure)
        await ensureExpanded(page, 'Variable Definitions (Optional)');

        await page.getByRole('button', { name: "Auto Add Variables" }).click();
        await expect(page.locator('input[value="name"]')).toBeVisible();
        await page.fill('textarea[placeholder="Description"]', 'Name of the person');

        // Short Prompt
        await ensureExpanded(page, 'Short Prompt (Optional)');
        await expect(page.locator('textarea[name="shortContent"]')).toBeVisible();
        await page.fill('textarea[name="shortContent"]', 'Longer hello {{name}}');

        // Usage
        await ensureExpanded(page, 'Usage Example (Optional)');
        await expect(page.locator('textarea[name="usageExample"]')).toBeVisible();
        await page.fill('textarea[name="usageExample"]', 'Input: John -> Output: Hello John');

        await page.click('button[type="submit"]');

        // Assertions
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });
        await expect(page.locator('main h1')).toHaveText(promptTitle);
        // Label might use the description if provided
        // Check for the variable input specifically by ID (which we set to the key)
        const varInput = page.locator('input#name');
        await expect(varInput).toBeVisible({ timeout: 10000 });
        // REMOVED per user request: await expect(page.getByText('Name of the person').first()).toBeVisible({ timeout: 10000 });

        // Open sections to verify content on the detail page
        await ensureExpanded(page, 'Short Prompt'); // Assuming title on detail page is "Short Prompt"
        await expect(page.getByText('Longer hello {{name}}')).toBeVisible();

        await ensureExpanded(page, 'Usage Example'); // Assuming title on detail page is "Usage Example"
        await expect(page.getByText('Input: John -> Output: Hello John')).toBeVisible();
    });



    // 5. Full Combination
    test('should create a prompt with ALL fields populated', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Full Prompt ${timestamp}`;
        const tagName = `FullTag${timestamp}`;

        await page.goto('/prompts/new');

        // Basic
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="description"]', 'Full description');
        // Tag
        await page.fill('input[placeholder="Select or create tags..."]', tagName);
        await page.click(`text=Create tag "${tagName}"`);
        // TagSelector pills do not have # prefix
        await expect(page.locator(`span:has-text("${tagName}")`)).toBeVisible();

        // Content
        await page.fill('textarea[name="content"]', 'Full content {{var}}');

        // Auto Add Variables
        await ensureExpanded(page, 'Variable Definitions (Optional)');
        await page.click('button:has-text("Auto Add Variables")');
        await page.fill('textarea[placeholder="Description"]', 'Variable desc');

        // Optional Sections
        await ensureExpanded(page, 'Short Prompt (Optional)');
        await page.fill('textarea[name="shortContent"]', 'Full long content');

        // Result Text
        await ensureExpanded(page, 'Results (Optional)');
        await expect(page.locator('textarea[name="resultText"]')).toBeVisible();
        await page.fill('textarea[name="resultText"]', 'Expected result text');



        await page.click('button[type="submit"]');

        // Assertions
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 20000 });
        await expect(page.locator('main h1')).toHaveText(promptTitle);
        await expect(page.getByText('Full description')).toBeVisible();
        await expect(page.getByText(tagName, { exact: false }).first()).toBeVisible();
        await expect(page.getByText('Expected result text')).toBeVisible();

    });

    // 6. Expandable Variable Textarea
    test('should allow maximizing variable input for large text editing', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Expandable Variable Prompt ${timestamp}`;
        const variableName = 'userInput';

        // 1. Create Prompt with Variable
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', `Process this: {{${variableName}}}`);
        await ensureExpanded(page, 'Variable Definitions (Optional)');
        await page.click('button:has-text("Auto Add Variables")');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // 2. Verify Textarea and Maximize Button
        // The label is typically the variable name
        const variableLabel = page.locator(`label[for="${variableName}"]`);
        await expect(variableLabel).toBeVisible();

        const variableInput = page.locator(`textarea#${variableName}`); // Changed from input to textarea
        await expect(variableInput).toBeVisible();

        const maximizeBtn = variableInput.locator('xpath=following-sibling::button'); // The button is next to the textarea
        await expect(maximizeBtn).toBeVisible();

        // 3. Open Modal
        await maximizeBtn.click();
        const modal = page.locator('text=Editing Variable');
        await expect(modal).toBeVisible();
        // Scope to the modal container to ensure we aren't finding the obscured sidebar label
        const modalContainer = page.locator('.fixed.z-50');
        await expect(modalContainer.locator(`text=${variableName}`)).toBeVisible(); // Variable name in header

        // 4. Edit in Modal
        const modalTextarea = page.locator('textarea[placeholder*="regular or large text"]');
        await expect(modalTextarea).toBeVisible();
        const longText = 'This is a very long text that I am typing into the modal to verify functionality.';
        await modalTextarea.fill(longText);

        // 5. Save/Close Modal
        await page.click('button:has-text("Done")');
        await expect(modal).not.toBeVisible();

        // 6. Verify Value in Main Textarea
        await expect(variableInput).toHaveValue(longText);
    });

    // 7. Download Markdown
    test('should allow downloading prompt as markdown', async ({ page }) => {
        const timestamp = Date.now();
        const promptTitle = `Download Test ${timestamp}`;

        // Create simple prompt
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Content to download');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // Setup download listener
        const downloadPromise = page.waitForEvent('download');

        // Click download button
        await page.click('button[title="Download Markdown"]');

        const download = await downloadPromise;
        // Slug generation: lowercase, non-alphanumeric to dashes. "Download Test <ts>" -> "download-test-<ts>"
        // Filename should end with _v1.md
        expect(download.suggestedFilename()).toMatch(/download-test-.+_v1\.md$/);
    });

    // 8. Copy Prompt Content
    test('should copy prompt content with replaced variables (including [[var]])', async ({ page, context }) => {
        const timestamp = Date.now();
        const promptTitle = `Copy Test ${timestamp}`;
        // Grant permissions for clipboard access
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        // Create prompt mixed variables
        await page.goto('/prompts/new');
        await page.fill('input[name="title"]', promptTitle);
        await page.fill('textarea[name="content"]', 'Start {{var1}} Middle [[var2]] End');

        // Auto variables
        await ensureExpanded(page, 'Variable Definitions (Optional)');
        await page.click('button:has-text("Auto Add Variables")');
        // var1 and var2 should be detected

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/prompts\/.+/, { timeout: 10000 });

        // Fill variables
        await page.fill('textarea#var1', 'Alpha');
        await page.fill('textarea#var2', 'Omega');

        // Click Copy
        await page.click('button:has-text("Copy")');

        // Verify Clipboard
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText).toBe('Start Alpha Middle Omega End');

        // Verify visual feedback
        await expect(page.getByText('Copied')).toBeVisible();
    });

    // 9. Expandable Description in Create Prompt
    test('should allow maximizing description in create form', async ({ page }) => {
        await page.goto('/prompts/new');

        const descriptionArea = page.locator('textarea[name="description"]');
        await expect(descriptionArea).toBeVisible();

        // Button should be visible
        const maximizeBtn = descriptionArea.locator('xpath=following-sibling::button');
        await expect(maximizeBtn).toBeVisible();

        // Open Modal
        await maximizeBtn.click();
        const modal = page.locator('.fixed.z-50');
        await expect(modal).toBeVisible();
        await expect(modal).toContainText('Description'); // Label is passed as "Description"

        // Type in modal
        const modalTextarea = modal.locator('textarea');
        const longText = 'This description was typed in the modal popup.';
        await modalTextarea.fill(longText);

        // Save
        await page.click('button:has-text("Done")');
        await expect(modal).not.toBeVisible();

        // Verify in form
        await expect(descriptionArea).toHaveValue(longText);
    });
});

