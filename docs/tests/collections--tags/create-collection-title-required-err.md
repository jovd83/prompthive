title: [ERR] Create Collection - Title required
description: Validates ERR: Submit collection without title in epic "Collections & Tags".
test_suite: Collections & Tags
Covered requirement: Create Collection
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform title required | Submit collection without title |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [collections.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/collections.spec.ts)#Submit collection without title
