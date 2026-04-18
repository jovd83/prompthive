const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login as admin
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000); // give time to load dashboard

  // Go to collections/new to create one
  await page.goto('http://localhost:3000/collections/new');
  await page.waitForTimeout(1000);
  try {
    await page.fill('input[name="title"], input[name="name"]', 'Test Collection A11y');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  } catch(e) { console.log('Collection creation failed', e.message); }
  const collSplit = page.url().split('/');
  const collId = collSplit[collSplit.length - 1] === 'new' ? '123' : collSplit[collSplit.length - 1]; 

  // Go to prompts/new
  await page.goto('http://localhost:3000/prompts/new');
  await page.waitForTimeout(1000);
  try {
    await page.fill('input[name="title"]', 'Test Prompt A11y');
    await page.fill('textarea', 'Test content');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  } catch(e) { console.log('Prompt creation failed', e.message); }
  const pmptSplit = page.url().split('/');
  const promptId = pmptSplit[pmptSplit.length - 1] === 'new' ? '456' : pmptSplit[pmptSplit.length - 1]; 

  // dump light
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await context.storageState({ path: 'sandbox/auth/state-light.json' });

  // dump dark
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await context.storageState({ path: 'sandbox/auth/state-dark.json' });

  fs.mkdirSync('sandbox/auth', { recursive: true });
  fs.writeFileSync('a11y-urls.json', JSON.stringify([
    'http://localhost:3000/dashboard',
    'http://localhost:3000/collections',
    `http://localhost:3000/collections/${collId}`,
    'http://localhost:3000/collections/new',
    `http://localhost:3000/collections/${collId}/edit`,
    'http://localhost:3000/prompts/new',
    `http://localhost:3000/prompts/${promptId}/edit`,
    `http://localhost:3000/prompts/${promptId}`,
    'http://localhost:3000/settings',
    'http://localhost:3000/import-export',
    'http://localhost:3000/help',
    'http://localhost:3000/dashboard?search=test'
  ], null, 2));

  console.log("SUCCESS READY");
  await browser.close();
})();
