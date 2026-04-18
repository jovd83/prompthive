### Create Prompt: Unicode, Emojis, and RTL Encoding

**Title:** Create Prompt: Unicode, Emojis, and RTL Encoding

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enter "Unicode & RTL Test 🌍" into the title input | - |
| 2 | Enter "complexString" into the 'contentTextarea' | - |
| 3 | Click on the submit button | - |
| 4 | Wait for navigation | Wait for application to navigate to Prompts page and Verify that the contentLocator contains the text "مرحبا بالعالم" and Verify that the contentLocator contains the text "👨‍👩‍👧‍👦" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Create Prompt: Unicode, Emojis, and RTL Encoding`
