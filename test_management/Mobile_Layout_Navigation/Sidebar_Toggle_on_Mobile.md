### Sidebar Toggle on Mobile

**Title:** Sidebar Toggle on Mobile

**Test Suite:** Mobile Layout & Navigation

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify expectation on the 'sidebar' and Verify expectation on the 'backdrop' |
| 2 | Click on the menu btn | Verify expectation on the 'sidebar' and Verify expectation on the 'backdrop' |
| 3 | Click on the Sidebar-close-button element | Verify expectation on the 'sidebar' and Verify expectation on the 'backdrop' |
| 4 | Click on the menu btn | Verify expectation on the 'sidebar' and Verify expectation on the 'backdrop' and Verify expectation on the 'sidebar' and Verify expectation on the 'backdrop' |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/mobile_layout.spec.ts`
- **Test Name:** `Sidebar Toggle on Mobile`
