### Data Import: Malicious Payload Injection via JSON

**Title:** Data Import: Malicious Payload Injection via JSON

**Test Suite:** Data Management - Enriched Datasets & Error Handling

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | Verify that the text 'Import complete' is visible |
| 2 | Navigate through the UI to the application home page | Verify that the text 'Malicious <script>alert(1)<' is visible |
| 3 | Set up database test records | Verify that the 'count' equals "0" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/data_management.spec.ts`
- **Test Name:** `Data Import: Malicious Payload Injection via JSON`
