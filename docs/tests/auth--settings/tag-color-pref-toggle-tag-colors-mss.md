title: [MSS] Tag Color Pref. - Toggle Tag Colors
description: Validates MSS: Enable/disable Tag Colors, verify UI in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: Tag Color Pref.
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform toggle tag colors | Enable/disable Tag Colors, verify UI |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [settings.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/settings.spec.ts)#Enable/disable Tag Colors, verify UI
