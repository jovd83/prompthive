### Toggle Global Settings: SQLi in JSON inputs (if applicable)

**Title:** Toggle Global Settings: SQLi in JSON inputs (if applicable)

**Test Suite:** ADMIN role Constraints

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Click on the Admin-save-button element | Verify that the 'registrationEnabled' equals "false" |
| 3 | Interact with database to set up or modify test data | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/settings.spec.ts`
- **Test Name:** `Toggle Global Settings: SQLi in JSON inputs (if applicable)`
