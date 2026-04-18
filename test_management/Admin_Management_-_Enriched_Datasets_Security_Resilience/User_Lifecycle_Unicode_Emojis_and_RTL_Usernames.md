### User Lifecycle: Unicode, Emojis, and RTL Usernames

**Title:** User Lifecycle: Unicode, Emojis, and RTL Usernames

**Test Suite:** Admin Management - Enriched Datasets & Security Resilience

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Users Settings page | - |
| 2 | Enter "unicodeUser" into the Username field | - |
| 3 | Enter "testEmail" into the Email field | - |
| 4 | Enter "Pass123!🚀" into the Password field | Verify that the text 'User created successfullyUtilisateur créé avec succès' is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/admin.spec.ts`
- **Test Name:** `User Lifecycle: Unicode, Emojis, and RTL Usernames`
