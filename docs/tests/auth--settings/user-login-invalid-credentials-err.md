title: [ERR] User Login - Invalid credentials
description: Validates ERR: Login with invalid credentials in epic "Auth & Settings".
test_suite: Auth & Settings
Covered requirement: User Login
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform invalid credentials | Login with invalid credentials |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [auth.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/auth.spec.ts)#Login with invalid credentials
