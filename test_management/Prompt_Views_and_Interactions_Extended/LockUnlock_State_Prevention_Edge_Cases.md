### Lock/Unlock State Prevention Edge Cases

**Title:** Lock/Unlock State Prevention Edge Cases

**Test Suite:** Prompt Views and Interactions Extended

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the lock button | Verify that the unlock button is visible and Verify expectation on the 'editBtn' |
| 2 | Navigate through the UI to the Prompts   TestPromptId  Edit page | Verify that the 'isDisabledSubmit' equals "" and Verify that the 'path === `prompts${testPromptId}`' equals "" |
| 3 | Click on the unlock button | Verify that the lock button is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Lock/Unlock State Prevention Edge Cases`
