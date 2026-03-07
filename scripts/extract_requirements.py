import os
import glob
import re

docs_path = 'c:/projects/antigravity_prj/prompthive/docs/functional analysis'
files = glob.glob(os.path.join(docs_path, 'Epic_*.md'))

summary = "# Requirements Summary\n\n"

for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    epic_title_match = re.search(r'# Epic: (.+)', content)
    epic_title = epic_title_match.group(1) if epic_title_match else os.path.basename(filename)
    summary += f"## Epic: {epic_title}\n\n"
    
    stories = re.split(r'## User Story: ', content)[1:]
    for story in stories:
        story_lines = story.split('\n')
        story_name = story_lines[0].strip()
        summary += f"### User Story: {story_name}\n"
        
        # Extract AC
        ac_section = ""
        in_ac = False
        for line in story_lines:
            if line.startswith('### 3. Acceptance Criteria'):
                in_ac = True
                continue
            elif in_ac and line.startswith('### 4.'):
                break
            elif in_ac and line.strip().startswith('*   ['):
                ac_section += f"- {line.strip()}\n"
        
        if ac_section:
            summary += "**Acceptance Criteria:**\n"
            summary += ac_section + "\n"

output_path = 'c:/projects/antigravity_prj/prompthive/docs/tests/Requirements_Summary.md'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(summary)

print(f"Summary generated at {output_path}")
