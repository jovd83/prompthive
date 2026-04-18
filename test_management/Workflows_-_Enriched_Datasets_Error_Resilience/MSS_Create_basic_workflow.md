### MSS: Create basic workflow

**Title:** MSS: Create basic workflow

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | Verify that the title input is visible |
| 2 | Enter "title" into the title input | Verify that the saveWorkflowBtn is visible |
| 3 | Click on the Save workflow btn | - |
| 4 | Wait for navigation | Wait for application to navigate to Workflows      Edit page |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `MSS: Create basic workflow`
