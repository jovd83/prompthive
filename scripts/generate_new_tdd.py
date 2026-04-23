import os

base_dir = 'c:/projects/antigravity_prj/prompthive/docs/tests/prompt-management'
os.makedirs(base_dir, exist_ok=True)

new_scenarios = [
    ("create-prompt-missing-title-err", "Missing Title", "Verify boundary missing title rejects", "ERR", "Create Prompt: Missing Title (Boundary Edge Case)"),
    ("create-prompt-high-volume-variables-ext", "High Volume Variables", "Verify auto-add detects 40+ syntaxes", "EXT", "Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume"),
    ("create-prompt-payload-injection-err", "Payload Injection", "Verify XSS & SQLi Resilience", "ERR", "Create Prompt: XSS & SQLi Payload Injection Resilience"),
    ("create-prompt-maximal-text-size-ext", "Maximal Text Size", "Verify 10,000 Chars Text Constraints", "EXT", "Create Prompt: Maximal Text Size (10,000 chars)"),
    ("create-prompt-unicode-rtl-ext", "Unicode & RTL", "Verify Emojis and RTL Encoding", "EXT", "Create Prompt: Unicode, Emojis, and RTL Encoding"),
    ("compare-versions-empty-content-rejection-err", "Empty Content Rejection", "Verify rejecting empty edits", "ERR", "Edit Prompt: Empty Content Rejection"),
    ("lock-prompt-lock-state-prevention-err", "Lock State Prevention", "Verify Direct URL access on Locked Prompt", "ERR", "Lock/Unlock State Prevention Edge Cases")
]

for filename, story, desc, stype, test_name in new_scenarios:
    content = f"""title: [{stype}] Prompt Management - {story}
description: {desc} in epic "Prompt Management".
test_suite: Prompt Management
Covered requirement: Create Prompt / Prompt Management
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform edge case interaction | Expected boundary validation occurs |
execution_type: UI
design_status: Ready
test_engineer: Antigravity
test_level: 2
jira: N/A
Test script: [prompts.spec.ts](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/prompts.spec.ts)#{test_name}
"""
    with open(os.path.join(base_dir, f"{filename}.md"), 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Generated {len(new_scenarios)} TDD docs.")
