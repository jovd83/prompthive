title: [ERR] User Registration - Uniqueness check
description: Validates ERR: Register with existing email/username in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: User Registration
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform uniqueness check | Register with existing email/username |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [auth.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/auth.spec.ts)#Register with existing email/username
