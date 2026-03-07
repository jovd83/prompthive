title: [EXT] Create Unicode User
description: EXT: Admin creation of Unicode Usernames in epic/feature "Admin".
test_suite: Admin Extended Regression
Covered requirement: Edge case for Create Unicode User
preconditions:
A) Test environment is running and seeded.
B) Specific edge case data (massive blocks, unicode, payloads) is ready for insertion.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Inject/Fill edge case data | Data is accepted without crash or UI break |
| 3 | Submit/Save | Resulting saved data reflects input correctly and securely |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 2
jira: N/A
Test script: [admin.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/admin.spec.ts)#User Lifecycle: Unicode, Emojis, and RTL Usernames
