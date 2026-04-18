### MSS: Create basic collection

**Title:** MSS: Create basic collection

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Wait for navigation | Wait for application to navigate to Collections page and Verify that the collectionHeader contains the text "title" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `MSS: Create basic collection`
