### Enriched User Visibility: Batch Select/Deselect (Edge Case)

**Title:** Enriched User Visibility: Batch Select/Deselect (Edge Case)

**Test Suite:** General Settings - Enriched Datasets & Stress Testing

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Interact with database to set up or modify test data | - |
| 3 | Click on the Checkboxes[i] | - |
| 4 | Click on the Save visibility btn | Verify that the text 'Settings saved successfullyenregistrés avec succès' is visible and Verify that the 'unchecked' equals "hideCount" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/settings.spec.ts`
- **Test Name:** `Enriched User Visibility: Batch Select/Deselect (Edge Case)`
