### Privilege Escalation Attempt: Direct API Toggle for Non-Admin

**Title:** Privilege Escalation Attempt: Direct API Toggle for Non-Admin

**Test Suite:** Admin Settings Protection & Direct Data Hijack Protection

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "seedUser.username" | - |
| 3 | Navigate through the UI to the application home page | Verify that the enableRegistrationToggle is hidden and Verify that the enablePrivatePromptsToggle is hidden |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/settings.spec.ts`
- **Test Name:** `Privilege Escalation Attempt: Direct API Toggle for Non-Admin`
