import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
    readonly usernameInput: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput?: Locator; // Some apps have it, some don't
    readonly registerButton: Locator;
    readonly errorMessage: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.getByPlaceholder('username');
        this.emailInput = page.getByPlaceholder(/email|user@example.com/i);
        this.passwordInput = page.getByPlaceholder(/password|Basic password/i);
        this.registerButton = page.getByRole('button', { name: /Submit|Register|S'inscrire/i });
        this.errorMessage = page.locator('.text-red-500').or(page.getByText(/already taken|already registered|disabled/i));
        this.successMessage = page.getByText(/Account created successfully/i);
    }

    async goto() {
        await this.page.goto('/register');
    }

    async register(username: string, email: string, passwordPlain: string, expectSuccess: boolean = true) {
        await this.usernameInput.fill(username);
        await this.emailInput.fill(email);
        await this.passwordInput.fill(passwordPlain);
        await this.registerButton.click();

        if (expectSuccess) {
            // Usually redirects to login or dashboard
            await this.page.waitForURL(url => url.pathname.includes('/login') || url.pathname === '/', { timeout: 15000 });
        }
    }
}
