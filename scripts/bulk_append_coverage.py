import os
import re

coverage_path = 'c:/projects/antigravity_prj/prompthive/docs/tests/e2e-ui-regression-coverage-plan.md'

with open(coverage_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Aggregated new rows for all modules
bulk_rows = """
| Authentication | Login | Massive Input | ERR: Login with 10k+ Chars Resilience | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Login attempt with Extremely Long Username/Password (Boundary) | Ready |
| Authentication | Login | XSS & SQLi | ERR: Login Payload Injection Resistance | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Login attempt with XSS & SQLi payloads | Ready |
| Authentication | Registration | Duplicate | ERR: Duplicate Name/Email Rejection | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Verify Registration: Duplicate Username/Email Error | Ready |
| Authentication | Registration | Unicode | EXT: Unicode & Emoji Username Support | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Verify Registration: Maximal Text Size and Unicode | Ready |
| Authentication | Registration | SQLi | ERR: SQLi Payload Resilience check via DB Count | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Verify Registration: SQLi Payload Resilience | Ready |
| Settings | General | Stress Test | EXT: Rapid Language/Workflow Toggles | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Toggle Application Language Stress Test (Rapid Toggles) | Ready |
| Settings | User Visibility | Batch Select | EXT: Stress Test Batch Hidden Users Mapping | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Enriched User Visibility: Batch Select/Deselect (Edge Case) | Ready |
| Settings | Admin Security | Privilege Esc | ERR: User Direct API Bypass Restriction | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Privilege Escalation Attempt: Direct API Toggle for Non-Admin | Ready |
| Collections | Creation | Massive Data | EXT: 10,000 Chars Description Content Constraints | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Create Collection: 10,000 Character Title & Description (Maximal Stress) | Ready |
| Collections | Creation | Unicode | EXT: Unicode & RTL Title/Desc Persistence | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Create Collection: Unicode, Emojis, and RTL (Complex Encoding) | Ready |
| Collections | Creation | Injection | ERR: XSS & SQLi Payload Protection | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Create Collection: Payload Injection Protection (XSS/SQLi) | Ready |
| Collections | Access Control | Private Col | ERR: Accessing Private Collection of Another User | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Access Control: Accessing Private Collection of Another User | Ready |
| Data Management | Import | Massive Payload | EXT: 50,000 Character JSON Content Import | UI | [data_management.spec.ts](../../tests/e2e/regression/data_management.spec.ts)#Data Import: Stress Test with Massive JSON (50,000 chars) | Ready |
| Data Management | Import | Broken Format | ERR: Corrupted JSON Format Error Resilience | UI | [data_management.spec.ts](../../tests/e2e/regression/data_management.spec.ts)#Data Import: Error Resilience on Broken JSON Format | Ready |
| Data Management | Export | Unicode Check | EXT: Export Multi-Encoding Data Persistence | UI | [data_management.spec.ts](../../tests/e2e/regression/data_management.spec.ts)#Data Export: Encoding Check (Unicode/Emoji Persistence) | Ready |
| Workflows | Creation | Massive Data | EXT: 10,000 Character Descriptions Persistence | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Create Workflow: 10,000 Character Description (Maximal Constraint) | Ready |
| Workflows | Access Control | Private WF | ERR: Accessing Private Workflow of Another User | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Access Control: Accessing Private Workflow of Another User | Ready |
| Admin | User Mgmt | Unicode | EXT: Admin creation of Unicode Usernames | UI | [admin.spec.ts](../../tests/e2e/regression/admin.spec.ts)#User Lifecycle: Unicode, Emojis, and RTL Usernames | Ready |
| Admin | Security | Privilege Esc | ERR: Regular User Admin Access Re-verification | UI | [admin.spec.ts](../../tests/e2e/regression/admin.spec.ts)#Security: Privilege Escalation Prevention Re-verification | Ready |
"""

if "| Authentication | Login | Massive Input" not in content:
    # Append to the end of the table
    content += bulk_rows

    with open(coverage_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Master coverage plan updated for all modules.")
