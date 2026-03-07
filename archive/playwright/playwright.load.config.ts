
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './loadtests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [
        ['html'],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 30000,
        navigationTimeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run db:test:push && cross-env APP_ENV=test npm run e2e:dev -- -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: false,
        timeout: 120000,
    },
});
