import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly signInButton: Locator;
    readonly errorMessage: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByPlaceholder('username');
        this.passwordInput = page.locator('input[type="password"]');
        this.signInButton = page.getByRole('button', { name: 'Sign In' });
        this.errorMessage = page.locator('.text-red-500').or(page.getByText('Invalid credentials', { exact: false }));
        this.successMessage = page.getByText('Account created successfully', { exact: false });
    }

    async goto(params?: { registered?: boolean }) {
        if (params?.registered) {
            await this.page.goto('/login?registered=true');
        } else {
            await this.page.goto('/login');
        }
    }

    async login(username: string, passwordPlain: string, expectSuccess: boolean = true) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(passwordPlain);
        await this.signInButton.click();

        if (expectSuccess) {
            // Wait for redirect to dashboard to ensure login completed
            await this.page.waitForURL(url => url.pathname === '/', { timeout: 10000 });
        }
    }
}
