title: [MSS] General Settings - Show Prompting Tips
description: Validates MSS: Toggle 'Show Prompting Tips' in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: General Settings
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform show prompting tips | Toggle 'Show Prompting Tips' |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [settings.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/settings.spec.ts)#Toggle 'Show Prompting Tips'
