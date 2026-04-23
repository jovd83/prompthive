import os
import re

base_dir = r"c:/projects/antigravity_prj/prompthive/docs/tests"

parsed_docs = []

for root, dirs, files in os.walk(base_dir):
    if 'handovers' in root or '.git' in root or 'archive' in root:
        continue
    for file in files:
        if file.endswith('.md') and not file in ['Requirements_Summary.md', 'e2e-ui-regression-coverage-plan.md', 'e2e-ui-regression-tdd.md']:
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            title_match = re.search(r'^title:\s*(.*)', content, flags=re.MULTILINE)
            if not title_match:
                continue
            title = title_match.group(1).strip()
            
            desc_match = re.search(r'^description:\s*(.*)', content, flags=re.MULTILINE)
            desc = desc_match.group(1).strip() if desc_match else ''

            precond_match = re.search(r'^preconditions:\n(.*?)\n^steps:', content, flags=re.MULTILINE|re.DOTALL)
            precond = precond_match.group(1).strip() if precond_match else ''
            
            suite_match = re.search(r'^test_suite:\s*(.*)', content, flags=re.MULTILINE)
            suite = suite_match.group(1).strip() if suite_match else 'Uncategorized'

            # find lines with |
            steps = []
            step_lines = re.findall(r'^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|', content, flags=re.MULTILINE)
            for s_num, s_act, s_exp in step_lines:
                steps.append((s_num, s_act, s_exp))
                
            parsed_docs.append({
                'title': title,
                'description': desc,
                'preconditions': precond,
                'suite': suite,
                'steps': steps
            })

suites_map = {}
for doc in parsed_docs:
    s = doc['suite']
    if s not in suites_map:
        suites_map[s] = []
    suites_map[s].append(doc)

xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<testsuite name="Prompthive E2E Tests">']

for suite_name, docs in suites_map.items():
    suite_safe = suite_name.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
    xml_parts.append(f'  <testsuite name="{suite_safe}">')
    for doc in docs:
        tc_name = doc['title'].replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
        xml_parts.append(f'    <testcase name="{tc_name}">')
        xml_parts.append(f'      <summary><![CDATA[{doc["description"]}]]></summary>')
        precond = doc['preconditions'].replace('\n', '<br />')
        xml_parts.append(f'      <preconditions><![CDATA[{precond}]]></preconditions>')
        xml_parts.append(f'      <execution_type><![CDATA[2]]></execution_type>') # 2 = Automated
        xml_parts.append(f'      <steps>')
        for num, act, exp in doc['steps']:
            xml_parts.append(f'        <step>')
            xml_parts.append(f'          <step_number><![CDATA[{num}]]></step_number>')
            xml_parts.append(f'          <actions><![CDATA[{act}]]></actions>')
            xml_parts.append(f'          <expectedresults><![CDATA[{exp}]]></expectedresults>')
            xml_parts.append(f'          <execution_type><![CDATA[2]]></execution_type>')
            xml_parts.append(f'        </step>')
        xml_parts.append(f'      </steps>')
        xml_parts.append(f'    </testcase>')
    xml_parts.append('  </testsuite>')

xml_parts.append('</testsuite>\n')

output_path = r"c:\projects\antigravity_prj\prompthive\docs\tests\testlink_import.xml"
with open(output_path, "w", encoding="utf-8") as f:
    f.write('\n'.join(xml_parts))

print(f"TestLink XML generated with {len(parsed_docs)} test cases at docs/tests/testlink_import.xml")
