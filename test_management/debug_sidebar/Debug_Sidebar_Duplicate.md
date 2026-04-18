### Debug Sidebar Duplicate

**Title:** Debug Sidebar Duplicate

**Test Suite:** debug_sidebar

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter credentials and sign in as "seedUser.username" | - |
| 3 | Wait for navigation | Wait for application to navigate to  page |
| 4 | Navigate through the UI to the Collections New page | - |
| 5 | Enter "title" into the locator('input[name="title"]') | - |
| 6 | Click on the locator('button[type="submit"]') | - |
| 7 | Wait for navigation | Wait for application to navigate to Url    Url Pathname StartsWith  Collections      Url Pathname      Collections New page |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/debug_sidebar.spec.ts`
- **Test Name:** `Debug Sidebar Duplicate`
