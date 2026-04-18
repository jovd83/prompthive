### Metadata and Variable Interaction

**Title:** Metadata and Variable Interaction

**Test Suite:** Prompt Views and Interactions Extended

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify that the promptTitleDisplay' contains text "Management Test Prompt Focus" and Verify that the 'toBeEmpty' not equals "" and Verify that the text 'Fill Variables is visible |
| 2 | Enter "World" into the 'locator'textarea[id="name"]'' | - |
| 3 | Click on the copy button | Verify that the text 'Copied' is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Metadata and Variable Interaction`
