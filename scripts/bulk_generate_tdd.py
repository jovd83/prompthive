import os

base_test_dir = 'c:/projects/antigravity_prj/prompthive/docs/tests'

new_tdd_data = [
    # Auth
    ('auth-settings', 'auth-login-massive-input-err', 'Login Massive Input', 'ERR: 10k+ Chars Resilience', 'auth.spec.ts', 'Login attempt with Extremely Long Username/Password (Boundary)'),
    ('auth-settings', 'auth-login-xss-sqli-err', 'Login XSS & SQLi', 'ERR: Payload Injection Resistance', 'auth.spec.ts', 'Login attempt with XSS & SQLi payloads'),
    ('auth-settings', 'auth-register-unicode-ext', 'Registration Unicode', 'EXT: Unicode & Emoji Support', 'auth.spec.ts', 'Verify Registration: Maximal Text Size and Unicode'),
    ('auth-settings', 'auth-register-sqli-err', 'Registration SQLi', 'ERR: SQLi Payload Resilience', 'auth.spec.ts', 'Verify Registration: SQLi Payload Resilience'),
    
    # Settings
    ('auth-settings', 'settings-general-stress-ext', 'Settings Stress Test', 'EXT: Rapid Language/Workflow Toggles', 'settings.spec.ts', 'Toggle Application Language Stress Test (Rapid Toggles)'),
    ('auth-settings', 'settings-admin-security-err', 'Admin Security Bypass', 'ERR: Direct API Toggle Restriction', 'settings.spec.ts', 'Privilege Escalation Attempt: Direct API Toggle for Non-Admin'),

    # Collections
    ('collections', 'collections-create-massive-data-ext', 'Create Massive Collection', 'EXT: 10k Chars Description Constraints', 'collections.spec.ts', 'Create Collection: 10,000 Character Title & Description (Maximal Stress)'),
    ('collections', 'collections-create-unicode-ext', 'Create Unicode Collection', 'EXT: Unicode & RTL Title/Desc Resilience', 'collections.spec.ts', 'Create Collection: Unicode, Emojis, and RTL (Complex Encoding)'),
    ('collections', 'collections-create-injection-err', 'Create Injection Protection', 'ERR: XSS & SQLi Payload Protection', 'collections.spec.ts', 'Create Collection: Payload Injection Protection (XSS/SQLi)'),
    ('collections', 'collections-access-control-private-err', 'Access Private Collection', 'ERR: Unauthorized Access Rejection', 'collections.spec.ts', 'Access Control: Accessing Private Collection of Another User'),

    # Data Management
    ('data-management', 'data-import-massive-payload-ext', 'Import Massive JSON', 'EXT: 50k Chars Import Stress', 'data_management.spec.ts', 'Data Import: Stress Test with Massive JSON (50,000 chars)'),
    ('data-management', 'data-import-broken-format-err', 'Import Broken JSON', 'ERR: Broken Format Resilience', 'data_management.spec.ts', 'Data Import: Error Resilience on Broken JSON Format'),
    ('data-management', 'data-export-unicode-check-ext', 'Export Unicode Check', 'EXT: Multi-Encoding Persistence in File', 'data_management.spec.ts', 'Data Export: Encoding Check (Unicode/Emoji Persistence)'),

    # Workflows
    ('workflows', 'workflows-create-massive-data-ext', 'Create Massive Workflow', 'EXT: 10k Chars Desc Constraint', 'workflows.spec.ts', 'Create Workflow: 10,000 Character Description (Maximal Constraint)'),
    ('workflows', 'workflows-access-control-private-err', 'Access Private Workflow', 'ERR: Unauthorized Run Access Rejection', 'workflows.spec.ts', 'Access Control: Accessing Private Workflow of Another User'),

    # Admin
    ('admin', 'admin-user-mgmt-unicode-ext', 'Create Unicode User', 'EXT: Admin creation of Unicode Usernames', 'admin.spec.ts', 'User Lifecycle: Unicode, Emojis, and RTL Usernames'),
    ('admin', 'admin-security-privilege-esc-err', 'Admin Bypass Re-verify', 'ERR: User Admin Access Restriction', 'admin.spec.ts', 'Security: Privilege Escalation Prevention Re-verification')
]

for folder, filename, story, desc, spec_file, test_block in new_tdd_data:
    dir_path = os.path.join(base_test_dir, folder)
    os.makedirs(dir_path, exist_ok=True)
    
    content = f"""title: [{desc.split(':')[0]}] {story}
description: {desc} in epic/feature "{folder.capitalize()}".
test_suite: {folder.capitalize()} Extended Regression
Covered requirement: Edge case for {story}
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
Test script: [{spec_file}](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/{spec_file})#{test_block}
"""
    with open(os.path.join(dir_path, f"{filename}.md"), 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Generated {len(new_tdd_data)} new TDD documents across all modules.")
