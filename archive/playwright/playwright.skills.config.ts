import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load the test environment variables for the test runner's Prisma client
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './skills-frontend-tests',
    /* Run tests in files in parallel */
    fullyParallel: false, // Changed to false for stability with SQLite
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: 1, // Changed to 1 worker for stability
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'playwright-report/skills-results.json' }]
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:3003',

        headless: false,

        /* Collect trace on retry as recommended by playwright-skill */
        trace: 'on-first-retry',

        /* Capture screenshot on failure */
        screenshot: 'on',

        /* Record video on failure */
        video: 'on',

        /* Increase action timeout for slower environments */
        actionTimeout: 60000,
        navigationTimeout: 60000,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chromium',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Google Chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        }
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npx cross-env APP_ENV=test dotenv -e .env.test -- next dev -p 3003',
        url: 'http://localhost:3003',
        reuseExistingServer: !process.env.CI,
    },
});
