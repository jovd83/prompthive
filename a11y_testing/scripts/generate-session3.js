const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try to register first
  console.log('Registering user...');
  await page.goto('http://localhost:3000/register');
  const userString = 'a11ytest' + Date.now();
  await page.fill('input[placeholder="username"]', userString);
  await page.fill('input[placeholder="user@example.com"]', userString + '@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Now login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', userString);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Create Collection
  console.log('Creating Collection...');
  await page.goto('http://localhost:3000/collections/new');
  await page.waitForTimeout(1000);
  let collId = '1';
  try {
    await page.fill('input[placeholder="My Awesome Collection"], input', 'A11y Collection');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const split = page.url().split('/');
    if(split[split.length-1] !== 'new') collId = split[split.length-1];
  } catch(e) { console.log('Collection error', e.message); }

  // Create Prompt
  console.log('Creating Prompt...');
  await page.goto('http://localhost:3000/prompts/new');
  await page.waitForTimeout(1000);
  let promptId = '1';
  try {
    await page.fill('input', 'A11y Prompt'); // Title is usually the first input
    await page.fill('textarea', 'some content');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const split2 = page.url().split('/');
    if(split2[split2.length-1] !== 'new') promptId = split2[split2.length-1];
  } catch(e) { console.log('Prompt error', e.message); }

  // Dark state
  console.log('Saving dark state...');
  await page.evaluate(() => { localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); });
  await context.storageState({ path: 'sandbox/auth/state-dark.json' });

  // Light state
  console.log('Saving light state...');
  await page.evaluate(() => { localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); });
  await context.storageState({ path: 'sandbox/auth/state-light.json' });

  // Build URLs
  const urls = [
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
    'http://localhost:3000/dashboard?search=test' // search-feature
  ];
  fs.mkdirSync('sandbox/auth', { recursive: true });
  fs.writeFileSync('a11y-urls.json', JSON.stringify(urls, null, 2));

  console.log("SUCCESS NEW");
  await browser.close();
})();
