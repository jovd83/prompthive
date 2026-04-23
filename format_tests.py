import os
import re
import glob

def clean_text(text):
    # Fix the huge "Wait for navigation..." string
    text = re.sub(
        r"Wait for application to navigate to Url\s+Url Pathname page and Verify that the 'toContainTexttitle' not contains text \"title\" and Verify that the 'toBeVisible' is not visible",
        'Wait for the application to navigate to the designed collection page, and verify the title is updated and the loading indicator is hidden',
        text
    )
    
    # Generic replacements
    text = re.sub(r"Wait for application to navigate to Url\s+Url Pathname page", "Wait for the application to navigate to the required page", text)
    
    # "Verify that the 'something' contains text"
    text = re.sub(r"Verify that the 'toContainTexttitle' not contains text \"(.*?)\"", r'Verify that the title does not contain "\1"', text)
    text = re.sub(r"Verify that the 'toContainTexttitle' contains text \"(.*?)\"", r'Verify that the title contains "\1"', text)
    
    # "Verify that the 'something' is visible/hidden"
    text = re.sub(r"Verify that the 'toBeVisible' is visible", "Verify that the requested element is visible", text)
    text = re.sub(r"Verify that the 'toBeVisible' is not visible", "Verify that the requested element is not visible", text)
    
    text = re.sub(r"Verify that the '(.*?)' is hidden", r"Verify that the \1 is hidden", text)
    text = re.sub(r"Verify that the '(.*?)' is visible", r"Verify that the \1 is visible", text)
    text = re.sub(r"Verify that the '(.*?)' field is visible", r"Verify that the \1 field is visible", text)
    
    # Text contains
    text = re.sub(r"Verify that the '(.*?)' contains text \"(.*?)\"", r'Verify that the \1 contains the text "\2"', text)
    text = re.sub(r"Verify that the '(.*?)' not contains text \"(.*?)\"", r'Verify that the \1 does not contain the text "\2"', text)
    
    # "Click on the 'saveBtn'" -> "Click on the saveBtn" (we can clean camelCase maybe?)
    def camel_to_words(match):
        raw = match.group(1)
        # e.g. saveBtn -> Save Btn -> Save button
        words = re.sub(r"([A-Z])", r" \1", raw).strip().capitalize()
        # if ends with Btn, change to Button
        words = re.sub(r"Btn$", "button", words)
        return f"Click on the {words}"
        
    text = re.sub(r"Click on the '(.*?)'", camel_to_words, text)
    
    # "Enter 'value' into the 'field' field"
    # "Enter \"hugeUser\" into the 'Username Utilisateur' field"
    def clean_field(match):
        val = match.group(1)
        field = match.group(2)
        # some fields are like "Username Utilisateur", keep first word usually
        field = field.split()[0]
        return f'Enter "{val}" into the {field} field'
        
    text = re.sub(r"Enter \"(.*?)\" into the '(.*?)' field", clean_field, text)

    # Clean up navigation URLs
    text = re.sub(r"Collections\s+Coll Id page", "Collections page", text)
    text = re.sub(r"Settings Users page", "Users Settings page", text)

    return text

def process_directory(base_dir):
    pattern = os.path.join(base_dir, '**', '*.md')
    md_files = glob.glob(pattern, recursive=True)
    
    for file_path in md_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = clean_text(content)
        
        if new_content != content:
            print(f"Updated {file_path}")
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

if __name__ == '__main__':
    process_directory('c:/projects/antigravity_prj/prompthive/test_management')
