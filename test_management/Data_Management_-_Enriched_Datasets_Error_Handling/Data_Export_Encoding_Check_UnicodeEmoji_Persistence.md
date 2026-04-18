### Data Export: Encoding Check (Unicode/Emoji Persistence)

**Title:** Data Export: Encoding Check (Unicode/Emoji Persistence)

**Test Suite:** Data Management - Enriched Datasets & Error Handling

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Set up database test records | - |
| 2 | Interact with database to set up or modify test data | - |
| 3 | Navigate through the UI to the application home page | Verify that the 'content' contains "Unicode Export 🌍" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/data_management.spec.ts`
- **Test Name:** `Data Export: Encoding Check (Unicode/Emoji Persistence)`
