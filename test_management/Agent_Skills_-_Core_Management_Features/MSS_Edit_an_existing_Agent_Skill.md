### MSS: Edit an existing Agent Skill

**Title:** MSS: Edit an existing Agent Skill

**Test Suite:** Agent Skills - Core Management Features

**Preconditions**
1. User is logged into the application with a standard account

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Click on the new skill button | - |
| 2 | Wait for navigation | Wait for application to navigate to Skills New page |
| 3 | Enter "https://github.com/jovd83/edit-skill-test" into the repo url input | - |
| 4 | Enter "Skill To Edit" into the title input | - |
| 5 | Enter "npx -y skill@latest ./" into the locator('input[name="install command"]') | - |
| 6 | Click on the edit button | - |
| 7 | Wait for navigation | Wait for application to navigate to Skills   Edit page |
| 8 | Enter "newTitle" into the locator('input[name="title"]') | - |
| 9 | Enter "newInstallCmd" into the locator('input[name="install command"]') | Verify that the last contains the text "edit-skill-test" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/skills.spec.ts`
- **Test Name:** `MSS: Edit an existing Agent Skill`
