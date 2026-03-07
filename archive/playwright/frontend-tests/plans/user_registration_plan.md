# Test Plan: User Registration

## User Story
**As a** Guest
**I want to** create a new account
**So that** I can access the platform features.

## Assumptions
- The application is running with an empty database or clean state.
- The `GlobalConfiguration.registrationEnabled` is True by default for the happy path.

## Specific Locators Found by Planner
- **Username Input**: `page.getByLabel('Username')` or `page.getByPlaceholder('username')`
- **Email Input**: `page.getByLabel('Email')` or `page.getByPlaceholder('user@example.com')`
- **Password Input**: `page.getByLabel('Password')` or `page.getByPlaceholder('Basic password')`
- **Submit Button**: `page.getByRole('button', { name: 'Submit' })`
- **Error Container**: `page.locator('.text-red-500')`
- **Success Redirect**: `/login?registered=true`

---

## Scenario 1: Successful User Registration (Happy Path)
1. **Navigate to Registration**: Go to `/register`.
2. **Input Fields**:
    - Fill Username with a unique name (e.g., `newuser1`).
    - Fill Email with a unique email (e.g., `newuser1@example.com`).
    - Fill Password with `Password123!`.
3. **Submit**: Click the "Submit" button.
4. **Expected Outcome**: The page redirects to `/login?registered=true`.

## Scenario 2: Error on Duplicate Email
1. **Setup**: Assume a user with email `testuser@example.com` is already registered (via DB seed or API).
2. **Navigate to Registration**: Go to `/register`.
3. **Input Fields**:
    - Fill Username with `differentuser`.
    - Fill Email with `testuser@example.com`.
    - Fill Password with `Password123!`.
4. **Submit**: Click the "Submit" button.
5. **Expected Outcome**: Form validation shows an error message: "Email already registered" inside `.text-red-500`.

## Scenario 3: Error on Duplicate Username
1. **Setup**: Assume a user with username `testuser` is already registered.
2. **Navigate to Registration**: Go to `/register`.
3. **Input Fields**:
    - Fill Username with `testuser`.
    - Fill Email with `different@example.com`.
    - Fill Password with `Password123!`.
4. **Submit**: Click the "Submit" button.
5. **Expected Outcome**: Form validation shows an error message: "Username already taken" inside `.text-red-500`.

## Scenario 4: Registration Disabled
1. **Setup**: Assume `GlobalConfiguration.registrationEnabled` is `false` in the database.
2. **Navigate to Registration**: Go to `/register`.
3. **Input Fields**: Fill out valid Username, Email, and Password.
4. **Submit**: Click the "Submit" button.
5. **Expected Outcome**: Show error message "Registration is currently disabled by the administrator" inside `.text-red-500`.
