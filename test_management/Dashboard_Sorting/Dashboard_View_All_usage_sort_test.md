### Dashboard View All usage sort test

**Title:** Dashboard View All usage sort test

**Test Suite:** Dashboard Sorting

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Sort Usage Order Desc page | Verify that the 'mostViewedIndex' equals "-1" and Verify that the 'leastViewedIndex' equals "-1" and Verify that the 'mostViewedIndex' equals "leastViewedIndex" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/dashboard_sorting.spec.ts`
- **Test Name:** `Dashboard View All usage sort test`
