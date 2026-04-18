### MSS: Delete prompt

**Title:** MSS: Delete prompt

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up database test records | - |
| 2 | Click on the delete button | Verify that the confirm delete button is visible |
| 3 | Click on the confirm delete button | - |
| 4 | Wait for navigation | Wait for the application to navigate to the required page |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `MSS: Delete prompt`
