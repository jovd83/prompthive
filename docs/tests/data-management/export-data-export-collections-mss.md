title: [MSS] Export Data - Export collections
description: Validates MSS: Export selected collections in epic "Data Management".
test_suite: Data Management
Covered requirement: Export Data
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform export collections | Export selected collections |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [data_management.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/data_management.spec.ts)#Export selected collections
