import { test, expect } from '../fixtures/db-fixture';
import { LoginPage } from '../pom/LoginPage';

test('Debug Sidebar Duplicate', async ({ page, seedUser }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(seedUser.username, seedUser.plainTextPassword!);
    await page.waitForURL('**/');

    // Create a collection
    await page.goto('/collections/new');
    const title = `Debug Col ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => url.pathname.startsWith('/collections/') && url.pathname !== '/collections/new');
    console.log(`CURRENT URL: ${page.url()}`);

    await page.waitForTimeout(2000);

    const headerHtml = await page.locator('div.p-4.border-b.border-border').first().evaluate(el => el.outerHTML);
    console.log(`HEADER HTML: ${headerHtml}`);

    const sidebars = page.locator('[data-testid="sidebar"]');
    const count = await sidebars.count();
    console.log(`FOUND ${count} SIDEBARS ON COLLECTION PAGE`);

    for (let i = 0; i < count; i++) {
        const html = await sidebars.nth(i).evaluate(el => el.outerHTML.substring(0, 300));
        console.log(`SIDEBAR ${i}: ${html}`);
    }

    const actionButtons = page.getByLabel('Collection actions');
    const actionCount = await actionButtons.count();
    console.log(`FOUND ${actionCount} ACTION BUTTONS`);
    for (let i = 0; i < actionCount; i++) {
        const html = await actionButtons.nth(i).evaluate(el => el.outerHTML.substring(0, 300));
        console.log(`ACTION BUTTON ${i}: ${html}`);
    }
});
