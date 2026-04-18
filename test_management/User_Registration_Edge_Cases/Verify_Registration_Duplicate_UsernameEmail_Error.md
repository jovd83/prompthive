### Verify Registration: Duplicate Username/Email Error

**Title:** Verify Registration: Duplicate Username/Email Error

**Test Suite:** User Registration Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "seedUser.username" into the username input | - |
| 3 | Enter "newemail_${Date.now()}@example.com" into the email input | - |
| 4 | Enter "SecurePass123!" into the password input | - |
| 5 | Click on the register button | Verify that the first contains the text "/Username already takenregistered/i" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Verify Registration: Duplicate Username/Email Error`
