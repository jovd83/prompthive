### Login attempt with XSS & SQLi payloads

**Title:** Login attempt with XSS & SQLi payloads

**Test Suite:** Authentication Flows - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "sqliPayload" into the username input | - |
| 3 | Enter "xssPayload" into the password input | - |
| 4 | Click on the sign in button | Verify that the first is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Login attempt with XSS & SQLi payloads`
