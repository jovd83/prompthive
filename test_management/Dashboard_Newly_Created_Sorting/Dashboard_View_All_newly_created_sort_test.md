### Dashboard View All newly created sort test

**Title:** Dashboard View All newly created sort test

**Test Suite:** Dashboard Newly Created Sorting

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Sort Date Order Desc page | Verify that the 'newPromptIndex' equals "-1" and Verify that the 'oldPromptIndex' equals "-1" and Verify that the 'newPromptIndex' equals "oldPromptIndex" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/dashboard_newly_created.spec.ts`
- **Test Name:** `Dashboard View All newly created sort test`
