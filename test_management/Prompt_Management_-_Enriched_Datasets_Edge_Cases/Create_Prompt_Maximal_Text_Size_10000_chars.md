### Create Prompt: Maximal Text Size (10,000 chars)

**Title:** Create Prompt: Maximal Text Size (10,000 chars)

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enter "Maximal Text Size Profile" into the title input | - |
| 2 | Enter "hugeString" into the 'contentTextarea' | - |
| 3 | Click on the submit button | - |
| 4 | Wait for navigation | Wait for application to navigate to Prompts page and Verify expectation on the 'contentLocator' |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Create Prompt: Maximal Text Size (10,000 chars)`
