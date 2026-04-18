### Login attempt with Extremely Long Username/Password (Boundary)

**Title:** Login attempt with Extremely Long Username/Password (Boundary)

**Test Suite:** Authentication Flows - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "hugeString" into the username input | - |
| 3 | Enter "hugeString" into the password input | - |
| 4 | Click on the sign in button | Verify that the sign in button) is visible and Verify that current page URL contains "/login" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Login attempt with Extremely Long Username/Password (Boundary)`
