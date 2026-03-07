title: [MSS] Workflow Visibility - Toggle Visibility
description: Validates MSS: Enable/disable Workspace visibility in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: Workflow Visibility
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform toggle visibility | Enable/disable Workspace visibility |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [settings.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/settings.spec.ts)#Enable/disable Workspace visibility
