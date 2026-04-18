### Stress Test: Rapid Create and Delete Cycle

**Title:** Stress Test: Rapid Create and Delete Cycle

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the actions menu button | Verify that the delete collection menu item is visible |
| 2 | Click on the delete collection menu item | Verify that the delete everything button is visible |
| 3 | Click on the delete everything button | Verify expectation on the 'page' |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `Stress Test: Rapid Create and Delete Cycle`
