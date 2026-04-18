import os
import re
import glob

def build_test_lookup(tests_dir):
    lookup = {}
    spec_files = glob.glob(os.path.join(tests_dir, '**', '*.spec.ts'), recursive=True)
    
    for file_path in spec_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Optional: track current describe block
        # We'll just look for test('Title' or test("Title" or test(`Title`
        matches = re.finditer(r"test\(\s*(['\"`])(.*?)\1\s*,", content)
        for match in matches:
            test_title = match.group(2)
            rel_path = os.path.relpath(file_path, tests_dir).replace('\\', '/')
            lookup[test_title] = rel_path
            
    return lookup

def map_md_files(md_dir, lookup):
    md_files = glob.glob(os.path.join(md_dir, '**', '*.md'), recursive=True)
    count = 0
    
    for file_path in md_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        m = re.search(r"\*\*Title:\*\*\s*(.*)", content)
        if m:
            title = m.group(1).strip()
            
            # Sometimes titles in md have markdown bold or trailing spaces
            # Let's clean the title
            title = title.replace('*', '').strip()
            
            if title in lookup:
                rel_spec_path = lookup[title]
                
                # Check if it already has mapping
                if "Automated Test Mapping**" not in content:
                    mapping_block = f"\n\n**Automated Test Mapping**\n- **File:** `tests/{rel_spec_path}`\n- **Test Name:** `{title}`\n"
                    new_content = content.rstrip() + mapping_block
                    
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Mapped: {file_path}")
                    count += 1
            else:
                print(f"No match found for: '{title}' in {file_path}")

if __name__ == '__main__':
    workspace = 'c:/projects/antigravity_prj/prompthive'
    lookup = build_test_lookup(os.path.join(workspace, 'tests'))
    print(f"Found {len(lookup)} tests in spec files.")
    map_md_files(os.path.join(workspace, 'test_management'), lookup)
