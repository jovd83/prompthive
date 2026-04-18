### Command Palette: Theme Toggle, Navigation, and Quick Actions

**Title:** Command Palette: Theme Toggle, Navigation, and Quick Actions

**Test Suite:** Search and Discovery

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "Theme" into the command palette input | - |
| 3 | Click on the Kbar-action-theme element | Verify expectation on the 'async' and Verify that the 'isDarkNow' equals "!isDarkInitially" |
| 4 | Click on the Settings action | - |
| 5 | Click on the Help action | - |
| 6 | Click on the Create prompt action | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/search.spec.ts`
- **Test Name:** `Command Palette: Theme Toggle, Navigation, and Quick Actions`
