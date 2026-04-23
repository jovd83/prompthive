title: [MSS] Execute Workflow - Summary on finish
description: Validates MSS: Finish workflow, verify summary in epic "Advanced Workflows".
test_suite: Advanced Workflows
Covered requirement: Execute Workflow
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform summary on finish | Finish workflow, verify summary |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [workflows.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/workflows.spec.ts)#Finish workflow, verify summary
