### MSS: List and view prompts

**Title:** MSS: List and view prompts

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Interact with database to set up or modify test data | - |
| 2 | Navigate through the UI to the application home page | Verify that the card is visible |
| 3 | Click on the Card | - |
| 4 | Wait for navigation | Wait for application to navigate to Prompts page and Verify that the promptTitleDisplay contains the text "title" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `MSS: List and view prompts`
