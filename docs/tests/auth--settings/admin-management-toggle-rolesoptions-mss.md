title: [MSS] Admin Management - Toggle roles/options
description: Validates MSS: Admin manages roles, private prompts, deletes user in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: Admin Management
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform toggle roles/options | Admin manages roles, private prompts, deletes user |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [admin.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/admin.spec.ts)#Admin manages roles, private prompts, deletes user
