### MSS: Delete workflow

**Title:** MSS: Delete workflow

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Interact with database to set up or modify test data | - |
| 2 | Navigate through the UI to the application home page | Verify that the requested element is not visible |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `MSS: Delete workflow`
