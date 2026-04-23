title: [UI] Advanced Workflows - Delete Workflow
description: MSS: Delete workflow in epic "Advanced Workflows".
test_suite: Advanced Workflows
Covered requirement: Basic Deletion
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform basic interaction | Action completes successfully |
| 3 | Verify outcome | Change is reflected in UI |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [workflows.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/workflows.spec.ts)#MSS: Delete workflow
