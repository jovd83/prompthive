# Test Plan: User Login

## User Story
**As a** Registered User
**I want to** log in with my credentials
**So that** I can access my dashboard.

## Assumptions
- The application is running.
- A user exists for the happy path tests.

## Specific Locators Found by Planner
- **Username Input**: `page.getByPlaceholder('username')`
- **Password Input**: `page.getByPlaceholder('••••••••')` (or `page.locator('input[type="password"]')`)
- **Submit Button**: `page.getByRole('button', { name: 'Sign In' })`
- **Error Container**: `page.locator('.text-red-500')`
- **Registration Success**: `page.getByText('Account created successfully. Please sign in.')`

---

## Scenario 1: Successful User Login (Happy Path)
1. **Setup**: Assume a valid user with username `testlogin` and password `Password123!` exists.
2. **Navigate to Login**: Go to `/login`.
3. **Input Fields**:
    - Fill Username with `testlogin`.
    - Fill Password with `Password123!`.
4. **Submit**: Click "Sign In".
5. **Expected Outcome**: The page redirects to `/` (dashboard).

## Scenario 2: Error on Invalid Credentials
1. **Navigate to Login**: Go to `/login`.
2. **Input Fields**:
    - Fill Username with `invaliduser`.
    - Fill Password with `wrongpassword`.
3. **Submit**: Click "Sign In".
4. **Expected Outcome**: Form shows "Invalid credentials" error inside `.text-red-500`.

## Scenario 3: Verify Registration Success Message
1. **Navigate to Login**: Go to `/login?registered=true`.
2. **Expected Outcome**: The green success message "Account created successfully. Please sign in." is visible.
