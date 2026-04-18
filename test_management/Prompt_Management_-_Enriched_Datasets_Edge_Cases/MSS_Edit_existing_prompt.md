### MSS: Edit existing prompt

**Title:** MSS: Edit existing prompt

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up database test records | - |
| 2 | Click on the edit button | - |
| 3 | Enter "newTitle" into the title input | - |
| 4 | Enter "Test revision" into the changelog input | - |
| 5 | Click on the submit button | - |
| 6 | Wait for navigation | Wait for application to navigate to Prompts   Prompt Id page and Verify that the promptTitleDisplay contains the text "newTitle" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `MSS: Edit existing prompt`
