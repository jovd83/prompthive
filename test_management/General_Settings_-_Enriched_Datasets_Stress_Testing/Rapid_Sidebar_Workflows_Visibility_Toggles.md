### Rapid Sidebar Workflows Visibility Toggles

**Title:** Rapid Sidebar Workflows Visibility Toggles

**Test Suite:** General Settings - Enriched Datasets & Stress Testing

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Click on the Evaluateel:  h t m l element => el | - |
| 3 | Click on the Evaluateel:  h t m l element => el | Verify that the sidebar a[href="workflows"]' is hidden |
| 4 | Click on the Evaluateel:  h t m l element => el | Verify that the sidebar a[href="workflows"]' is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/settings.spec.ts`
- **Test Name:** `Rapid Sidebar Workflows Visibility Toggles`
