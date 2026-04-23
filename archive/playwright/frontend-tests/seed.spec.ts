import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // Navigate to the home page to provide context for the agents
    await page.goto('/');
  });
});
