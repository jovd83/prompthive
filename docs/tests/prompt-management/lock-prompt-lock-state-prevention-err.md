title: [ERR] Prompt Management - Lock State Prevention
description: Verify Direct URL access on Locked Prompt in epic "Prompt Management".
test_suite: Prompt Management
Covered requirement: Create Prompt / Prompt Management
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform edge case interaction | Expected boundary validation occurs |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 2
jira: N/A
Test script: [prompts.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/prompts.spec.ts)#Lock/Unlock State Prevention Edge Cases
