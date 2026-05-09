import { test as base, expect, Locator, Page } from '@playwright/test';

// Define custom fixtures
type UserManagementFixtures = {
  adminPage: Page;
  userPage: Page;
};

// Extend base test to provide custom fixtures
const test = base.extend<UserManagementFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Simulate admin login (e.g., setting a cookie or local storage)
    await context.addCookies([{ name: 'session_token', value: 'admin_token', domain: 'localhost', path: '/' }]);
    await use(page);
    await context.close();
  },
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Simulate normal user login
    await context.addCookies([{ name: 'session_token', value: 'user_token', domain: 'localhost', path: '/' }]);
    await use(page);
    await context.close();
  },
});

test.describe('UserManagement Role-Based Access E2E', () => {
  test('admin should be able to view the user list', async ({ adminPage }) => {
    await adminPage.goto('/settings/users');
    
    // Web-first assertion checking for the main heading that only admins see
    await expect(adminPage.getByRole('heading', { name: /user management/i })).toBeVisible();
    
    // Check if the user table is visible
    await expect(adminPage.getByRole('table')).toBeVisible();
  });

  test('normal user should be denied access to the user list', async ({ userPage }) => {
    await userPage.goto('/settings/users');
    
    // User should see an access denied message or be redirected
    // Web-first assertion
    await expect(userPage.getByText(/access denied|unauthorized/i)).toBeVisible();
    
    // User table should NOT be visible
    await expect(userPage.getByRole('table')).toBeHidden();
  });
});
