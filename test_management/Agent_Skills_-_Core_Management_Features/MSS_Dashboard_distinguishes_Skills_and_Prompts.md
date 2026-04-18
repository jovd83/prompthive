### MSS: Dashboard distinguishes Skills and Prompts

**Title:** MSS: Dashboard distinguishes Skills and Prompts

**Test Suite:** Agent Skills - Core Management Features

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | - |
| 2 | Click on the First | - |
| 3 | Wait for navigation | Wait for application to navigate to Skills New page |
| 4 | Enter "https://github.com/jovd83/skill" into the locator('input[name="repo url"]') | - |
| 5 | Enter "skillTitle" into the locator('input[name="title"]') | - |
| 6 | Enter "npx skill" into the locator('input[name="install command"]') | - |
| 7 | Wait for navigation | Wait for application to navigate to Skills page |
| 8 | Navigate through the UI to the Q   EncodeURIComponent PromptTitle page | Verify that the promptCard contains the text "📝" |
| 9 | Navigate through the UI to the Q   EncodeURIComponent SkillTitle page | Verify that the skillCard contains the text "🤖" and Verify that the skillCard contains the text "Usage Example" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/skills.spec.ts`
- **Test Name:** `MSS: Dashboard distinguishes Skills and Prompts`
