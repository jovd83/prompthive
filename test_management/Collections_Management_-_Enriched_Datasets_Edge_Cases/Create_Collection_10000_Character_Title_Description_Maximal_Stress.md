### Create Collection: 10,000 Character Title & Description (Maximal Stress)

**Title:** Create Collection: 10,000 Character Title & Description (Maximal Stress)

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify that the text 'Too big: expected string to have <=100 characters' is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `Create Collection: 10,000 Character Title & Description (Maximal Stress)`
