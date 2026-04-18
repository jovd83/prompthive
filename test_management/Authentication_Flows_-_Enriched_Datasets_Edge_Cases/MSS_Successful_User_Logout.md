### MSS: Successful User Logout

**Title:** MSS: Successful User Logout

**Test Suite:** Authentication Flows - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "seedUser.username" | - |
| 3 | Wait for navigation | Wait for application to navigate to  page |
| 4 | Click on the Locator[data-testid="user-profile-trigger"]'' | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `MSS: Successful User Logout`
