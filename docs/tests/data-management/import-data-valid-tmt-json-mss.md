title: [MSS] Import Data - Valid TMT JSON
description: Validates MSS: Import valid JSON in epic "Data Management".
test_suite: Data Management
Covered requirement: Import Data
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform valid tmt json | Import valid JSON |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [data_management.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/data_management.spec.ts)#Import valid JSON
