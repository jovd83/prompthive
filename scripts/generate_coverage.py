import os

markdown_content = """# E2E UI Regression Coverage Plan

| Epic | User Story | Requirement / AC | Test Scenario | Execution Type | Playwright Script | Status |
|---|---|---|---|---|---|---|
| Advanced Workflows | Create Workflow | Verify identifying variables | MSS: Create workflow, verify variables identified | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Create workflow, verify variables identified | Ready |
| Advanced Workflows | Create Workflow | Map to Step Output | MSS: Map step output and verify | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Map step output and verify | Ready |
| Advanced Workflows | Create Workflow | Persist mappings | MSS: Save and verify persistence | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Save and verify persistence | Ready |
| Advanced Workflows | Execute Workflow | Auto-fill variables | MSS: Execute, verify variables auto-filled | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Execute, verify variables auto-filled | Ready |
| Advanced Workflows | Execute Workflow | Disable 'Next Step' | ERR: 'Next Step' disabled without output | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Disable 'Next Step' without output | Ready |
| Advanced Workflows | Execute Workflow | Summary on finish | MSS: Finish workflow, verify summary | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#Finish workflow, verify summary | Ready |
| Auth & Settings | User Registration | Uniqueness check | ERR: Register with existing email/username | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Register with existing email/username | Ready |
| Auth & Settings | User Registration | Registration disabled | ERR: Verify disabled registration error | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Verify disabled registration error | Ready |
| Auth & Settings | User Registration | Redirect on success | MSS: Register successfully, verify redirect | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Register successfully, verify redirect | Ready |
| Auth & Settings | User Login | Invalid credentials | ERR: Login with invalid credentials | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Login with invalid credentials | Ready |
| Auth & Settings | User Login | Successful login | MSS: Login successfully, verify redirect | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#Login successfully, verify redirect | Ready |
| Auth & Settings | General Settings | Show Prompting Tips | MSS: Toggle 'Show Prompting Tips' | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Toggle 'Show Prompting Tips' | Ready |
| Auth & Settings | Tag Color Pref. | Toggle Tag Colors | MSS: Enable/disable Tag Colors, verify UI | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Enable/disable Tag Colors, verify UI | Ready |
| Auth & Settings | Workflow Visibility | Toggle Visibility | MSS: Enable/disable Workspace visibility | UI | [settings.spec.ts](../../tests/e2e/regression/settings.spec.ts)#Enable/disable Workspace visibility | Ready |
| Auth & Settings | Admin Management | Toggle roles/options | MSS: Admin manages roles, private prompts, deletes user | UI | [admin.spec.ts](../../tests/e2e/regression/admin.spec.ts)#Admin manages roles, private prompts, deletes user | Ready |
| Auth & Settings | Private Prompts | Global setting | MSS: Disable private prompts globally, verify hidden | UI | [admin.spec.ts](../../tests/e2e/regression/admin.spec.ts)#Disable private prompts globally, verify hidden | Ready |
| Collections & Tags | Create Collection | Nested structure | MSS: Create nested collection | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Create nested collection | Ready |
| Collections & Tags | Create Collection | Title required | ERR: Submit collection without title | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Submit collection without title | Ready |
| Collections & Tags | Sidebar Navigation | Drag & Drop | MSS: Drag and drop collection to nest | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Drag and drop collection to nest | Ready |
| Collections & Tags | Sorting Control | Sort prompts | MSS: Sort collection by various options | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Sort collection by various options | Ready |
| Collections & Tags | Grid View | Collection grid | MSS: View collection grid, toggle favorite | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#View collection grid, toggle favorite | Ready |
| Collections & Tags | Bulk Actions | Multi-select tags | MSS: Multi-select prompts and apply tags | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#Multi-select prompts and apply tags | Ready |
| Data Management | Import Data | Valid TMT JSON | MSS: Import valid JSON | UI | [data_management.spec.ts](../../tests/e2e/regression/data_management.spec.ts)#Import valid JSON | Ready |
| Data Management | Export Data | Export collections | MSS: Export selected collections | UI | [data_management.spec.ts](../../tests/e2e/regression/data_management.spec.ts)#Export selected collections | Ready |
| Prompt Management | Create Prompt | Missing Content | ERR: Submit without content | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Submit without content | Ready |
| Prompt Management | Create Prompt | Auto-add variables | MSS: Auto-add variables to prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Auto-add variables to prompt | Ready |
| Prompt Management | Compare Versions | Compare diff | MSS: Compare prompt versions | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Compare prompt versions | Ready |
| Prompt Management | Lock Prompt | Lock/Unlock | MSS: Lock and unlock prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Lock and unlock prompt | Ready |
| Prompt Management | Link Prompts | Connect prompts | MSS: Link related prompts | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Link related prompts | Ready |
| Search & Discovery | Advanced Search | Filter panel | MSS: Use advanced search filters | UI | [search.spec.ts](../../tests/e2e/regression/search.spec.ts)#Use advanced search filters | Ready |
| Search & Discovery | Command Palette | Open palette | MSS: Navigate using command palette | UI | [search.spec.ts](../../tests/e2e/regression/search.spec.ts)#Navigate using command palette | Ready |
"""

output_path = 'c:/projects/antigravity_prj/prompthive/docs/tests/e2e-ui-regression-coverage-plan.md'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(markdown_content)

print(f"Coverage plan generated at {output_path}")
