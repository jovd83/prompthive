title: [MSS] Command Palette - Open palette
description: Validates MSS: Navigate using command palette in epic "Search & Discovery".
test_suite: Search & Discovery
Covered requirement: Command Palette
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform open palette | Navigate using command palette |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [search.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/search.spec.ts)#Navigate using command palette
