### MSS: Export and Import an Agent Skill

**Title:** MSS: Export and Import an Agent Skill

**Test Suite:** Agent Skills - Core Management Features

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the Skills New page | - |
| 2 | Enter "repoUrl" into the locator('input[name="repo url"]') | - |
| 3 | Enter "skillTitle" into the locator('input[name="title"]') | - |
| 4 | Enter "installCmd" into the locator('input[name="install command"]') | - |
| 5 | Navigate through the UI to the Import Export page | Verify that the 'exportPath' equals "" |
| 6 | Navigate through the UI to the application home page | - |
| 7 | Wait for navigation | Wait for application to navigate to Skills page |
| 8 | Navigate through the UI to the Import Export page | Verify that the bg-green-50' contains the text "Import complete" |
| 9 | Navigate through the UI to the application home page | Verify that the skillCard is visible and Verify that the skillCard contains the text "🤖" |
| 10 | Click on the Skill card | - |
| 11 | Wait for navigation | Wait for application to navigate to Skills page and Verify that the last contains the text "unique-export-skill" and Verify that the locator'main' contains the text "🤖" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/skills.spec.ts`
- **Test Name:** `MSS: Export and Import an Agent Skill`
