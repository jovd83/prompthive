### Privilege Escalation Protection (Attempting Admin URL)

**Title:** Privilege Escalation Protection (Attempting Admin URL)

**Test Suite:** Authentication Flows - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with Administrator privileges

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "seedUser.username" | - |
| 3 | Navigate through the UI to the Settings page | Verify that the adminSection is hidden |
| 4 | Navigate through the UI to the Admin page | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Privilege Escalation Protection (Attempting Admin URL)`
