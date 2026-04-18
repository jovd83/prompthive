### MSS: Group Import Skills

**Title:** MSS: Group Import Skills

**Test Suite:** Agent Skills - Core Management Features

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Import Export page | Verify that the groupImportSection is visible |
| 2 | Enter "https://github.com/jovd83/mock-skill-1\nhttps://github.com/jovd83/mock-skill-2" into the url input | - |
| 3 | Click on the Submit btn | Verify that the bg-green-100' contains the text "Successfully imported 2 skill(s)" |
| 4 | Navigate through the UI to the Collections page | Verify that the collectionCard is visible |
| 5 | Click on the Collection card | - |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/skills.spec.ts`
- **Test Name:** `MSS: Group Import Skills`
