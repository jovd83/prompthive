### Versioning and Restore - Iterative Boundary

**Title:** Versioning and Restore - Iterative Boundary

**Test Suite:** Prompt Views and Interactions Extended

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the edit button | - |
| 2 | Wait for navigation | Wait for application to navigate to Edit page |
| 3 | Enter "Updated Content v2 with multiple lines\\n\\nline 2\\nline 3!" into the 'contentTextarea' | - |
| 4 | Enter "Test changelog" into the 'locator'textarea[name="changelog"]'' | - |
| 5 | Click on the submit button | - |
| 6 | Wait for navigation | Wait for application to navigate to Url    Url Pathname      Prompts   TestPromptId page and Verify that the text 'Version 2' is visible and Verify that the font-mono' contains the text "Updated Content v2" |
| 7 | Click on the restore v1 button | Verify that the confirmationDialog is visible |
| 8 | Click on the confirm restore button | Verify that the text 'Version 3' is visible and Verify that the font-mono' contains the text "Original Content" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Versioning and Restore - Iterative Boundary`
