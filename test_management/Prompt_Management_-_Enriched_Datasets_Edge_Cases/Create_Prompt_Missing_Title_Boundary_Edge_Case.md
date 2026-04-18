### Create Prompt: Missing Title (Boundary Edge Case)

**Title:** Create Prompt: Missing Title (Boundary Edge Case)

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enter "Valid content without title" into the 'contentTextarea' | - |
| 2 | Click on the submit button | Verify that the isRequired' equals "" and Verify that the text 'Title is required is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Create Prompt: Missing Title (Boundary Edge Case)`
