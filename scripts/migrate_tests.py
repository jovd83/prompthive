import os
import glob

source_dir = 'c:/projects/antigravity_prj/prompthive/archive/playwright/skills-frontend-tests/e2e'
target_dir = 'c:/projects/antigravity_prj/prompthive/tests/e2e/regression'

files = glob.glob(f'{source_dir}/*.spec.ts')

for file_path in files:
    filename = os.path.basename(file_path)
    
    # Map search_discovery.spec.ts to search.spec.ts
    target_filename = filename
    if filename == 'search_discovery.spec.ts':
        target_filename = 'search.spec.ts'

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update imports
    content = content.replace("'../fixtures/db-fixture'", "'./fixtures/db-fixture'")
    content = content.replace("'../pom/", "'../../../pom/")
    content = content.replace("'../../lib/", "'../../../lib/")
    content = content.replace("'../../services/", "'../../../services/")
    content = content.replace("'../../components/", "'../../../components/")
    content = content.replace("'../../types/", "'../../../types/")

    target_path = os.path.join(target_dir, target_filename)

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Migrated {len(files)} test files to {target_dir}")
