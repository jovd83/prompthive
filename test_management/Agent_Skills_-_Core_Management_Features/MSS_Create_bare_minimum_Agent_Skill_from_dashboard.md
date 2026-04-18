### MSS: Create bare minimum Agent Skill from dashboard

**Title:** MSS: Create bare minimum Agent Skill from dashboard

**Test Suite:** Agent Skills - Core Management Features

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Verify application state | Verify that the new skill button is visible |
| 2 | Click on the new skill button | - |
| 3 | Wait for navigation | Wait for application to navigate to Skills New page |
| 4 | Enter "https://github.com/jovd83/mock-skill" into the repo url input | - |
| 5 | Enter "title" into the title input | - |
| 6 | Enter "This is a mock skill created during testing." into the description input | - |
| 7 | Enter "npx -y mock-skill@latest ./" into the install command input | - |
| 8 | Click on the submit button | Verify that the skillBadge is visible and Verify that the codeBox contains the text "mock-skill" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/skills.spec.ts`
- **Test Name:** `MSS: Create bare minimum Agent Skill from dashboard`
