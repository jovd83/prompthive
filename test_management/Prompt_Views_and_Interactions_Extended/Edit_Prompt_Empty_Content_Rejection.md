### Edit Prompt: Empty Content Rejection

**Title:** Edit Prompt: Empty Content Rejection

**Test Suite:** Prompt Views and Interactions Extended

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the edit button | - |
| 2 | Wait for navigation | Wait for application to navigate to Edit page |
| 3 | Enter "" into the 'contentTextarea' | - |
| 4 | Click on the submit button | Verify that current page URL equals "" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Edit Prompt: Empty Content Rejection`
