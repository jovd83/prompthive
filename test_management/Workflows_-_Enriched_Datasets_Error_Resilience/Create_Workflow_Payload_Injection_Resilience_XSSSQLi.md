### Create Workflow: Payload Injection Resilience (XSS/SQLi)

**Title:** Create Workflow: Payload Injection Resilience (XSS/SQLi)

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "xssTitle" into the title input | - |
| 3 | Enter "sqliDesc" into the description input | - |
| 4 | Click on the Save workflow btn | - |
| 5 | Set up database test records | Verify that the 'count' equals "0" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `Create Workflow: Payload Injection Resilience (XSS/SQLi)`
