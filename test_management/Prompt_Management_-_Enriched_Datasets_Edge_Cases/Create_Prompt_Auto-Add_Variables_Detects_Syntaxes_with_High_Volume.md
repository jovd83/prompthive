### Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume

**Title:** Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enter "High Volume Variables Prompt" into the title input | - |
| 2 | Enter "vars" into the 'contentTextarea' | - |
| 3 | Click on the Auto add variables btn | - |
| 4 | Click on the submit button | - |
| 5 | Wait for navigation | Wait for application to navigate to Prompts page |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume`
