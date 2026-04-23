title: [MSS] Lock Prompt - Lock/Unlock
description: Validates MSS: Lock and unlock prompt in epic "Prompt Management".
test_suite: Prompt Management
Covered requirement: Lock Prompt
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform lock/unlock | Lock and unlock prompt |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [prompts.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/prompts.spec.ts)#Lock and unlock prompt
