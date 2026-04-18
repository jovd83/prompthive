### Private Prompt Restriction and Authorization Constraints

**Title:** Private Prompt Restriction and Authorization Constraints

**Test Suite:** Prompt Views and Interactions Extended

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the make private button | Verify that the text-purple-600' is visible |
| 2 | Navigate through the UI to the application home page | - |
| 3 | Wait for navigation | Wait for application to navigate to Login page |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/prompts.spec.ts`
- **Test Name:** `Private Prompt Restriction and Authorization Constraints`
