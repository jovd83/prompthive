title: [MSS] Create Prompt - Auto-add variables
description: Validates MSS: Auto-add variables to prompt in epic "Prompt Management".
test_suite: Prompt Management
Covered requirement: Create Prompt
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform auto-add variables | Auto-add variables to prompt |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [prompts.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/prompts.spec.ts)#Auto-add variables to prompt
