const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Try to register first, just in case
  await page.goto('http://localhost:3000/register');
  const userString = 'a11ytest' + Date.now();
  await page.fill('input[name="username"]', userString);
  await page.fill('input[name="email"]', userString + '@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  // wait and see if it goes to login
  await page.waitForTimeout(2000);

  // Now login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="username"]', userString);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-login.png' });

  // Generate some URLs by clicking through the UI
  await page.goto('http://localhost:3000/collections/new');
  await page.waitForTimeout(1000);
  let collId = '1';
  try {
    await page.fill('input[name="name"], input[name="title"]', 'A11y Collection');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const split = page.url().split('/');
    if(split[split.length-1] !== 'new') collId = split[split.length-1];
  } catch(e) {}

  await page.goto('http://localhost:3000/prompts/new');
  await page.waitForTimeout(1000);
  let promptId = '1';
  try {
    await page.fill('input[name="title"]', 'A11y Prompt');
    await page.fill('textarea[name="content"], textarea', 'some content');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    const split2 = page.url().split('/');
    if(split2[split2.length-1] !== 'new') promptId = split2[split2.length-1];
  } catch(e) {}

  // Dark state
  await page.evaluate(() => { localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); });
  await context.storageState({ path: 'state-dark.json' });

  // Light state
  await page.evaluate(() => { localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); });
  await context.storageState({ path: 'state-light.json' });

  require('fs').writeFileSync('a11y-urls.json', JSON.stringify([
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

  console.log("SUCCESS NEW");
  await browser.close();
})();
