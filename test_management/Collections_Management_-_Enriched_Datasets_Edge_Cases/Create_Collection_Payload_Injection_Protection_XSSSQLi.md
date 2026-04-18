### Create Collection: Payload Injection Protection (XSS/SQLi)

**Title:** Create Collection: Payload Injection Protection (XSS/SQLi)

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify that the descLocator contains the text "<script>" |
| 2 | Set up database test records | Verify that the 'userCount' equals "0" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `Create Collection: Payload Injection Protection (XSS/SQLi)`
