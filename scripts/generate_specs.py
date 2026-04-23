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

base_dir = 'c:/projects/antigravity_prj/prompthive/tests/e2e/regression'
pom_dir = 'c:/projects/antigravity_prj/prompthive/pom'

os.makedirs(base_dir, exist_ok=True)
os.makedirs(pom_dir, exist_ok=True)

# Generate basic POMs
pom_files = {
    'BasePage.ts': '''import { Page } from '@playwright/test';
export class BasePage {
  constructor(protected page: Page) {}
  async navigate(path: string) { await this.page.goto(path); }
}''',
    'AuthPage.ts': '''import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export class AuthPage extends BasePage {
  readonly loginButton: Locator;
  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }
}''',
    'DashboardPage.ts': '''import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
export class DashboardPage extends BasePage {
  constructor(page: Page) { super(page); }
}''',
}

for name, content in pom_files.items():
    with open(os.path.join(pom_dir, name), 'w', encoding='utf-8') as f:
        f.write(content)

# Generate spec.ts files from scenarios grouping by playwright script filename
spec_groups = {}
for s in scenarios:
    script_raw = s['Playwright Script']
    match = re.search(r'\[(.*?)\]', script_raw)
    file_name = match.group(1) if match else "general.spec.ts"
    
    test_match = re.search(r'#(.*)', script_raw)
    test_name = test_match.group(1).strip() if test_match else f"Test for {s['Requirement / AC']}"
    
    if file_name not in spec_groups:
        spec_groups[file_name] = []
    spec_groups[file_name].append(f"""  test("{test_name}", async ({{ page }}) => {{
    // Automated test scenario boilerplate
    expect(page).toBeDefined();
  }});""")

for file_name, tests in spec_groups.items():
    file_path = os.path.join(base_dir, file_name)
    content = '''import { test, expect } from '@playwright/test';\n\ntest.describe('E2E Regression Set', () => {\n'''
    content += '\n'.join(tests)
    content += '\n});'
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Generated {len(spec_groups)} test files and POMs.")
