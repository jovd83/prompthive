### Dashboard View all for Recently Used uses mine=true

**Title:** Dashboard View all for Recently Used uses mine=true

**Test Suite:** Dashboard Recently Used Sort and Filter

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Mine True Sort Recent Order Desc page | Verify that the 'includes'My Recently Used Prompt'' equals "" and Verify that the 'includes'Other User Prompt'' equals "" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/dashboard_recently_used.spec.ts`
- **Test Name:** `Dashboard View all for Recently Used uses mine=true`
