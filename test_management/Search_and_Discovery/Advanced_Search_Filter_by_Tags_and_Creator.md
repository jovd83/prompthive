### Advanced Search: Filter by Tags and Creator

**Title:** Advanced Search: Filter by Tags and Creator

**Test Suite:** Search and Discovery

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Enter "SEO" into the tags input | - |
| 3 | Click on the Apply filter btn | - |
| 4 | Enter "" into the tags input | - |
| 5 | Enter "seedUser.email" into the creator input | - |
| 6 | Click on the Apply filter btn | Verify that the 'includes'SEO Keywords'' equals "" and Verify that the 'includes'Playwright Testing Guide'' equals "" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/search.spec.ts`
- **Test Name:** `Advanced Search: Filter by Tags and Creator`
