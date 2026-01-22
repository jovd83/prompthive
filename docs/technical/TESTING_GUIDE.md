# 🧪 Testing Guide & Environment Management

MyPromptHive uses separated environments to ensure that your development/production data (your real prompts) remains safe while you run automated tests.

## 🌍 Environments Explained

We have two distinct environments, each using its own database file.

| Environment | Database File | Purpose | Command to Run App |
| :--- | :--- | :--- | :--- |
| **Production** (Your Real Data) | `dev.db` | Your real working environment. Use this for building features, adding personal prompts, and general usage. | `npm run dev` |
| **Test** | `test.db` | A throwaway environment for automated testing. Data here is temporary and used to verify features work correctly without messing up your real data. | `npm run e2e:dev` |

---

## 🚦 How to Switch & Use

### 1. Production Mode (Your Real Data)
**Use this mode when:** You are coding, adding features, or using the app for your own prompts.
*   **Command**: `npm run dev`
*   **Database**: Uses `prisma/dev.db`.
*   **Data Persistence**: Data is kept forever until you delete it.

### 2. Running Automated Tests
**Use this mode when:** You want to check if the application is broken or verify a new feature complies with requirements.
*   **Command**: `npm run test` (Runs both Unit & E2E) or `npx playwright test` (E2E only)
*   **Behavior**:
    *   Automatically switches to the **Test environment**.
    *   Initializes/Resets the `test.db`.
    *   Starts a temporary app instance.
    *   Runs all tests and generates a report.
    *   **Does not touch** your `dev.db`.

### 3. Manual Testing in Test Environment (Debug Mode)
**Use this mode when:** You want to manually click around in the "Test" version of the app to debug a failed test or see what the clean slate looks like.
*   **Command**: `npm run e2e:dev`
*   **Database**: Uses `prisma/test.db`.
*   **Note**: You might need to push the schema to this DB first if it's the first time:
    ```bash
    npm run db:test:push
    ```

---

## 🔍 Validation Testing
Ideally, unit tests should verify that invalid inputs are caught by the **Zod Validation Layer** before reaching the database.
*   **Location**: `services/prompts.test.ts`
*   **Mechanism**: Mocks are used to simulate invalid inputs, ensuring exceptions are thrown or handled gracefully by the validation logic.

---

## 🛠️ Frequently Asked Questions

**Q: I added a prompt in `npm run dev` but I can't see it when I run tests?**
A: This is intentional! Tests run in an isolated environment (`test.db`) to ensure every test run starts clean. If you need data for a test, the test script itself creates it.

**Q: My tests are failing, how do I see what happened?**
A: Run `npx playwright show-report` to view screenshots, videos, and error logs of the failed tests.

**Q: How do I reset the Test Database completely?**
A: Since it's just a file, you can delete `prisma/test.db` and run `npm run db:test:push` again.
