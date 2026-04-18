### Search by Keyword and Technical ID

**Title:** Search by Keyword and Technical ID

**Test Suite:** Search and Discovery

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Set up database test records | - |
| 3 | Enter "Playwright" into the search input | - |
| 4 | Enter "prompt?.technicalId as string" into the search input | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/search.spec.ts`
- **Test Name:** `Search by Keyword and Technical ID`
