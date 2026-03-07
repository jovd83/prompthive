title: [MSS] Create Workflow - Map to Step Output
description: Validates MSS: Map step output and verify in epic "Advanced Workflows".
test_suite: Advanced Workflows
Covered requirement: Create Workflow
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform map to step output | Map step output and verify |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [workflows.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/workflows.spec.ts)#Map step output and verify
