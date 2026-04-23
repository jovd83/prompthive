title: [EXT] Create Massive Collection
description: EXT: 10k Chars Description Constraints in epic/feature "Collections".
test_suite: Collections Extended Regression
Covered requirement: Edge case for Create Massive Collection
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
Test script: [collections.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/collections.spec.ts)#Create Collection: 10,000 Character Title & Description (Maximal Stress)
