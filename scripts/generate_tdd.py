import os
import re

coverage_file = 'c:/projects/antigravity_prj/prompthive/docs/tests/e2e-ui-regression-coverage-plan.md'

with open(coverage_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

scenarios = []
header_passed = False
for line in lines:
    if line.strip().startswith('| Epic'):
        header_passed = True
        continue
    if line.strip().startswith('|---'):
        continue
    if header_passed and line.strip().startswith('|'):
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 7:
            scenarios.append({
                'Epic': parts[0],
                'User Story': parts[1],
                'Requirement / AC': parts[2],
                'Test Scenario': parts[3],
                'Execution Type': parts[4],
                'Playwright Script': parts[5],
                'Status': parts[6]
            })

base_dir = 'c:/projects/antigravity_prj/prompthive/docs/tests'

def safe_filename(name):
    return re.sub(r'[^a-zA-Z0-9_\-]', '', name.replace(' ', '-').lower())

for idx, s in enumerate(scenarios):
    feature_name = safe_filename(s['Epic'])
    story_name = safe_filename(s['User Story'])
    scenario_type = s['Test Scenario'][:3].upper() if ':' in s['Test Scenario'] else 'MSS'
    ac_name = safe_filename(s['Requirement / AC'])
    
    # Format:docs/tests/<feature-name>/<Requirement-ID>.md -> but it's meant to be one file per scenario.
    file_name = f"{story_name}-{ac_name}-{scenario_type.lower()}.md"
    dir_path = os.path.join(base_dir, feature_name)
    os.makedirs(dir_path, exist_ok=True)
    
    file_path = os.path.join(dir_path, file_name)
    
    # Parse Playwright Script link format `[file.spec.ts](../../tests/.../file.spec.ts)#test_name`
    # We want a direct file path for the URL part
    script_raw = s['Playwright Script']
    
    # the link is [workflows.spec.ts](../../tests/e2e/regression/workflows.spec.ts)#test
    # SKILL expects: [auth-settings.spec.ts](file:///tests/e2e/regression/auth-settings.spec.ts)#AUTH-US02: User Login
    match = re.search(r'\[(.*?)\]\((.*?)\)#(.*)', script_raw)
    if match:
        file_part = match.group(1)
        path_part = match.group(2).replace('../../', 'c:/projects/antigravity_prj/prompthive/')
        test_name = match.group(3)
        formatted_script = f"[{file_part}](file:///{path_part})#{test_name}"
    else:
        formatted_script = script_raw
        match = re.search(r'#(.*)', script_raw)
        test_name = match.group(1) if match else "Test"
    
    md_content = f"""title: [{scenario_type}] {s['User Story']} - {s['Requirement / AC']}
description: Validates {s['Test Scenario']} in epic "{s['Epic']}".
test_suite: {s['Epic']}
Covered requirement: {s['User Story']}
preconditions:
A) Test environment is running.
B) Database is seeded.
steps:
| Step | Action | Expected result |
|---|---|---|
| 1 | Navigate to feature | Page renders correctly |
| 2 | Perform {s['Requirement / AC'].lower()} | {s['Test Scenario'].split(':')[-1].strip()} |
execution_type: {s['Execution Type']}
design_status: Ready
test_engineer: Antigravity
test_level: 1
jira: N/A
Test script: {formatted_script}
"""
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

print(f"Generated {len(scenarios)} TDD documents.")
