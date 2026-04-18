### Login/Auth page should not have any automatically detectable accessibility issues

**Title:** Login/Auth page should not have any automatically detectable accessibility issues

**Test Suite:** Global Accessibility testing

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Login page | Verify that the 'violations' equals "[]" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/a11y.spec.ts`
- **Test Name:** `Login/Auth page should not have any automatically detectable accessibility issues`
