### MSS: Edit collection

**Title:** MSS: Edit collection

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up database test records | - |
| 2 | Navigate through the UI to the Collections   Col Id page | - |
| 3 | Click on the actions menu button | - |
| 4 | Click on the edit details menu item | - |
| 5 | Enter "newTitle" into the inline name input | - |
| 6 | Click on the inline save button | - |
| 7 | Wait for navigation | Wait for application to navigate to Collections   Col Id page and Verify that the collectionHeader contains the text "newTitle" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `MSS: Edit collection`
