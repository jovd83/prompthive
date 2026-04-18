### Security: Privilege Escalation Prevention Re-verification

**Title:** Security: Privilege Escalation Prevention Re-verification

**Test Suite:** Admin Management - Enriched Datasets & Security Resilience

**Preconditions**
1. User is logged into the application with Administrator privileges

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "seedUser.username" | - |
| 3 | Navigate through the UI to the Users Settings page | Verify that the first is hidden and Verify that the addUserBtn is hidden |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/admin.spec.ts`
- **Test Name:** `Security: Privilege Escalation Prevention Re-verification`
