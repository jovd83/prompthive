import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export class AuthPage extends BasePage {
  readonly loginButton: Locator;
  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }
}