### Workflow Execution: Broken Variable Mapping Resilience

**Title:** Workflow Execution: Broken Variable Mapping Resilience

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "Broken Map Test" into the title input | - |
| 3 | Click on the Save workflow btn | - |
| 4 | Wait for navigation | Wait for application to navigate to Workflows      Edit page |
| 5 | Enter "Step 1: Base" into the 'Search prompts' placeholder | - |
| 6 | Click on the Save workflow btn | - |
| 7 | Navigate through the UI to the Workflows page | Verify that the locator('textarea[placeholder*="input"]') is visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `Workflow Execution: Broken Variable Mapping Resilience`
