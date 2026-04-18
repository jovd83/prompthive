### Create Workflow: 10,000 Character Description (Maximal Constraint)

**Title:** Create Workflow: 10,000 Character Description (Maximal Constraint)

**Test Suite:** Workflows - Enriched Datasets & Error Resilience

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "title" into the title input | - |
| 3 | Enter "hugeDesc" into the description input | - |
| 4 | Click on the Save workflow btn | Verify expectation on the 'page' |
| 5 | Navigate through the UI to the Workflows page | Verify that the 'length' equals "10000" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/workflows.spec.ts`
- **Test Name:** `Create Workflow: 10,000 Character Description (Maximal Constraint)`
