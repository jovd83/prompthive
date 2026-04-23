title: [MSS] Private Prompts - Global setting
description: Validates MSS: Disable private prompts globally, verify hidden in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: Private Prompts
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform global setting | Disable private prompts globally, verify hidden |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [admin.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/admin.spec.ts)#Disable private prompts globally, verify hidden
