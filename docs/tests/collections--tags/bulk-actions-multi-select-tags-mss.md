title: [MSS] Bulk Actions - Multi-select tags
description: Validates MSS: Multi-select prompts and apply tags in epic "Collections & Tags".
test_suite: Collections & Tags
Covered requirement: Bulk Actions
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform multi-select tags | Multi-select prompts and apply tags |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [collections.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/collections.spec.ts)#Multi-select prompts and apply tags
