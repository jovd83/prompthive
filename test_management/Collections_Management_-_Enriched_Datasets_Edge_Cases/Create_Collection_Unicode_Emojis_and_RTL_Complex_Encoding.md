### Create Collection: Unicode, Emojis, and RTL (Complex Encoding)

**Title:** Create Collection: Unicode, Emojis, and RTL (Complex Encoding)

**Test Suite:** Collections Management - Enriched Datasets & Edge Cases

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify that the collectionHeader contains the text "مجموعة" and Verify that the collectionHeader contains the text "🌍" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/collections.spec.ts`
- **Test Name:** `Create Collection: Unicode, Emojis, and RTL (Complex Encoding)`
