import os

# 1. Define missing scenarios
missing_scenarios = [
    # Epic, User Story, Requirement, Scenario, Type, Script, Filename
    ("Prompt Management", "Create Prompt", "Basic Creation", "MSS: Create basic prompt", "UI", "prompts.spec.ts", "create-prompt-basic-mss"),
    ("Prompt Management", "Edit Prompt", "Basic Editing", "MSS: Edit existing prompt", "UI", "prompts.spec.ts", "edit-prompt-basic-mss"),
    ("Prompt Management", "Delete Prompt", "Basic Deletion", "MSS: Delete prompt", "UI", "prompts.spec.ts", "delete-prompt-mss"),
    ("Prompt Management", "List Prompts", "Dashboard View", "MSS: List and view prompts", "UI", "prompts.spec.ts", "list-prompts-mss"),
    
    ("Collections & Tags", "Create Collection", "Basic Creation", "MSS: Create basic collection", "UI", "collections.spec.ts", "create-collection-basic-mss"),
    ("Collections & Tags", "Edit Collection", "Basic Editing", "MSS: Edit collection", "UI", "collections.spec.ts", "edit-collection-basic-mss"),
    ("Collections & Tags", "Delete Collection", "Basic Deletion", "MSS: Delete collection", "UI", "collections.spec.ts", "delete-collection-mss"),
    
    ("Advanced Workflows", "Create Workflow", "Basic Creation", "MSS: Create basic workflow", "UI", "workflows.spec.ts", "create-workflow-basic-mss"),
    ("Advanced Workflows", "Edit Workflow", "Basic Editing", "MSS: Edit workflow", "UI", "workflows.spec.ts", "edit-workflow-basic-mss"),
    ("Advanced Workflows", "Delete Workflow", "Basic Deletion", "MSS: Delete workflow", "UI", "workflows.spec.ts", "delete-workflow-mss"),
    
    ("Auth & Settings", "User Session", "Logout", "MSS: Logout successfully", "UI", "auth.spec.ts", "logout-mss"),
]

base_docs_dir = 'c:/projects/antigravity_prj/prompthive/docs/tests'
coverage_path = 'c:/projects/antigravity_prj/prompthive/docs/tests/e2e-ui-regression-coverage-plan.md'

# 2. Generate TDD Markdown Files
for epic, story, req, scenario, stype, script, filename in missing_scenarios:
    # Map epic to folder name
    folder_map = {
        "Prompt Management": "prompt-management",
        "Collections & Tags": "collections",
        "Advanced Workflows": "workflows",
        "Auth & Settings": "auth--settings"
    }
    feature_folder = folder_map.get(epic, "general")
    feature_dir = os.path.join(base_docs_dir, feature_folder)
    os.makedirs(feature_dir, exist_ok=True)
    
    content = f"""title: [{stype}] {epic} - {story}
description: {scenario} in epic "{epic}".
test_suite: {epic}
Covered requirement: {req}
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform basic interaction | Action completes successfully |
| 3 | Verify outcome | Change is reflected in UI |
execution_type: {stype}
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: [{script}](file:///c:/projects/antigravity_prj/prompthive/tests/e2e/regression/{script})#{scenario}
"""
    with open(os.path.join(feature_dir, f"{filename}.md"), 'w', encoding='utf-8') as f:
        f.write(content)

# 3. Update Coverage Plan
with open(coverage_path, 'r', encoding='utf-8') as f:
    coverage_content = f.readlines()

# Clean up trailing empty lines
while coverage_content and not coverage_content[-1].strip():
    coverage_content.pop()

new_rows = []
for epic, story, req, scenario, stype, script, filename in missing_scenarios:
    # Check if scenario already in coverage content to avoid duplicates
    if any(scenario in line for line in coverage_content):
        continue
    
    row = f"| {epic} | {story} | {req} | {scenario} | {stype} | [{script}](../../tests/e2e/regression/{script})#{scenario} | Ready |\n"
    new_rows.append(row)

if new_rows:
    with open(coverage_path, 'a', encoding='utf-8') as f:
        # Ensure we are appending correctly if the file doesn't end with a newline
        if coverage_content and not coverage_content[-1].endswith("\n"):
            f.write("\n")
        f.writelines(new_rows)

print(f"Generated {len(missing_scenarios)} TDD docs and updated coverage plan.")
