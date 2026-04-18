### MSS: Create basic prompt

**Title:** MSS: Create basic prompt

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Wait for navigation | Wait for application to navigate to Prompts page and Verify that the promptTitleDisplay contains the text "title" |
| 2 | Navigate through the UI to the application home page | Verify that the first is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `MSS: Create basic prompt`
