### Verify Registration: SQLi Payload Resilience

**Title:** Verify Registration: SQLi Payload Resilience

**Test Suite:** User Registration Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Fill registration form and create new account | Verify that current page URL contains "/register" |
| 3 | Set up database test records | Verify that the 'userCount' equals "0" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Verify Registration: SQLi Payload Resilience`
