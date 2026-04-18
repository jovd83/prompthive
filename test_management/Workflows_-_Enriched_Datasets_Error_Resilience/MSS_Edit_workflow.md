### MSS: Edit workflow

**Title:** MSS: Edit workflow

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Interact with database to set up or modify test data | - |
| 2 | Set up database test records | - |
| 3 | Navigate through the UI to the Workflows   Wf Id  Edit page | - |
| 4 | Click on the Add step btn | - |
| 5 | Click on the Save workflow btn | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `MSS: Edit workflow`
