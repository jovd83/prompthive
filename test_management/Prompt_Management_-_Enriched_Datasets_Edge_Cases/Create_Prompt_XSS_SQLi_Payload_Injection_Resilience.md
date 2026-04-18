### Create Prompt: XSS & SQLi Payload Injection Resilience

**Title:** Create Prompt: XSS & SQLi Payload Injection Resilience

**Test Suite:** Prompt Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Enter "titlePayload" into the title input | - |
| 2 | Enter "payload" into the 'contentTextarea' | - |
| 3 | Click on the submit button | - |
| 4 | Wait for navigation | Wait for application to navigate to Prompts page and Verify that the contentLocator contains the text "<script>alert(xss)</script>" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Create Prompt: XSS & SQLi Payload Injection Resilience`
