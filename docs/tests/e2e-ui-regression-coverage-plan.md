# E2E UI Regression Coverage Plan

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
| Prompt Management | Create Prompt | Missing Title | ERR: Boundary Edge Case for Missing Title | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Missing Title (Boundary Edge Case) | Ready |
| Prompt Management | Create Prompt | High Volume Variables | EXT: Auto-Add Detects 40+ Syntaxes | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Auto-Add Variables Detects Syntaxes with High Volume | Ready |
| Prompt Management | Create Prompt | Payload Injection | ERR: XSS & SQLi Resilience | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: XSS & SQLi Payload Injection Resilience | Ready |
| Prompt Management | Create Prompt | Maximal Text Size | EXT: 10,000 Chars Text Constraints | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Maximal Text Size (10,000 chars) | Ready |
| Prompt Management | Create Prompt | Unicode & RTL | EXT: Emojis and RTL Encoding | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Create Prompt: Unicode, Emojis, and RTL Encoding | Ready |
| Prompt Management | Compare Versions | Empty Content Rejection | ERR: Reject Empty Edits | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Edit Prompt: Empty Content Rejection | Ready |
| Prompt Management | Lock Prompt | Lock State Prevention | ERR: Direct URL access on Locked Prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#Lock/Unlock State Prevention Edge Cases | Ready |

| Search & Discovery | Advanced Search | Filter panel | MSS: Use advanced search filters | UI | [search.spec.ts](../../tests/e2e/regression/search.spec.ts)#Use advanced search filters | Ready |
| Search & Discovery | Command Palette | Open palette | MSS: Navigate using command palette | UI | [search.spec.ts](../../tests/e2e/regression/search.spec.ts)#Navigate using command palette | Ready |

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
| Prompt Management | Create Prompt | Basic Creation | MSS: Create basic prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#MSS: Create basic prompt | Ready |
| Prompt Management | Edit Prompt | Basic Editing | MSS: Edit existing prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#MSS: Edit existing prompt | Ready |
| Prompt Management | Delete Prompt | Basic Deletion | MSS: Delete prompt | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#MSS: Delete prompt | Ready |
| Prompt Management | List Prompts | Dashboard View | MSS: List and view prompts | UI | [prompts.spec.ts](../../tests/e2e/regression/prompts.spec.ts)#MSS: List and view prompts | Ready |
| Collections & Tags | Create Collection | Basic Creation | MSS: Create basic collection | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#MSS: Create basic collection | Ready |
| Collections & Tags | Edit Collection | Basic Editing | MSS: Edit collection | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#MSS: Edit collection | Ready |
| Collections & Tags | Delete Collection | Basic Deletion | MSS: Delete collection | UI | [collections.spec.ts](../../tests/e2e/regression/collections.spec.ts)#MSS: Delete collection | Ready |
| Advanced Workflows | Create Workflow | Basic Creation | MSS: Create basic workflow | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#MSS: Create basic workflow | Ready |
| Advanced Workflows | Edit Workflow | Basic Editing | MSS: Edit workflow | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#MSS: Edit workflow | Ready |
| Advanced Workflows | Delete Workflow | Basic Deletion | MSS: Delete workflow | UI | [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#MSS: Delete workflow | Ready |
| Auth & Settings | User Session | Logout | MSS: Logout successfully | UI | [auth.spec.ts](../../tests/e2e/regression/auth.spec.ts)#MSS: Logout successfully | Ready |
