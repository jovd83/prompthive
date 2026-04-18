### Error on Invalid Credentials

**Title:** Error on Invalid Credentials

**Test Suite:** Authentication Flows - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "invalid_user" | Verify that the first is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Error on Invalid Credentials`
