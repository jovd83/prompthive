### Verify Registration: Maximal Text Size and Unicode

**Title:** Verify Registration: Maximal Text Size and Unicode

**Test Suite:** User Registration Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "unicodeUser" into the username input | - |
| 3 | Enter "unicode_${Date.now()}@example.com" into the email input | - |
| 4 | Enter "ABC.repeat(30) + 🌍🚀" into the password input | - |
| 5 | Click on the register button | - |
| 6 | Wait for navigation | Wait for application to navigate to Url    Url Pathname Includes  Login page and Verify that the successMessage is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/auth.spec.ts`
- **Test Name:** `Verify Registration: Maximal Text Size and Unicode`
