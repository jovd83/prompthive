import os
import re

coverage_file = 'c:/projects/antigravity_prj/prompthive/docs/tests/e2e-ui-regression-coverage-plan.md'

with open(coverage_file, 'r', encoding='utf-8') as f:
    content = f.read()

new_rows = """
| Prompt Management | Create Prompt | Missing Title | ERR: Boundary Edge Case for Missing Title | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Missing Title (Boundary Edge Case) | Ready |
| Prompt Management | Create Prompt | High Volume Variables | EXT: Auto-Add Detects 40+ Syntaxes | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume | Ready |
| Prompt Management | Create Prompt | Payload Injection | ERR: XSS & SQLi Resilience | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: XSS & SQLi Payload Injection Resilience | Ready |
| Prompt Management | Create Prompt | Maximal Text Size | EXT: 10,000 Chars Text Constraints | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Maximal Text Size (10,000 chars) | Ready |
| Prompt Management | Create Prompt | Unicode & RTL | EXT: Emojis and RTL Encoding | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Unicode, Emojis, and RTL Encoding | Ready |
| Prompt Management | Compare Versions | Empty Content Rejection | ERR: Reject Empty Edits | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Edit Prompt: Empty Content Rejection | Ready |
| Prompt Management | Lock Prompt | Lock State Prevention | ERR: Direct URL access on Locked Prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Lock/Unlock State Prevention Edge Cases | Ready |
"""

if "Maximal Text Size" not in content:
    content = content.replace("UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Link related prompts | Ready |", 
    "UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Link related prompts | Ready |" + new_rows)

    with open(coverage_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Coverage plan updated.")
