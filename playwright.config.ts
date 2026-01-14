import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './frontend-tests',
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
        ['json', { outputFile: 'playwright-report/results.json' }]
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.BASE_URL || 'http://localhost:3001',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Capture screenshot on failure */
        screenshot: 'only-on-failure',

        /* Record video on failure */
        video: 'retain-on-failure',

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
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'cross-env APP_ENV=test npm run db:test:push && cross-env APP_ENV=test npm run e2e:dev -- -p 3001',
        url: process.env.BASE_URL || 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
    },
});
