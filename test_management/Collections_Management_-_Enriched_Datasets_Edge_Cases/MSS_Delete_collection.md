### MSS: Delete collection

**Title:** MSS: Delete collection

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up database test records | - |
| 2 | Navigate through the UI to the Collections page | Verify that the collectionHeader contains the text "title" |
| 3 | Click on the actions menu button | Verify that the delete collection menu item is visible |
| 4 | Click on the delete collection menu item | Verify that the delete everything button is visible |
| 5 | Click on the delete everything button | - |
| 6 | Wait for navigation | Wait for the application to navigate to the designed collection page, and verify the title is updated and the loading indicator is hidden |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `MSS: Delete collection`
