---
title: Epic_Prompt_Management
version: 2.1
last_updated: 2025-12-23
status: Live
---

# Epic: Prompt Management

## User Story: Create Prompt
**As a** User
**I want to** create a new prompt template
**So that** I can reuse and share my best prompts.

### 1. Description
Users can create a prompt with extensive metadata including multiple versions, variables, and attachments. The system supports two variable syntaxes: `{{var}}` and `[[var]]`.

### 2. Technical Scope & Fields
*Derived from Code (components/CreatePromptForm.tsx)*

*   **Title**: Text - Required.
*   **Collection**: Dropdown - Selects parent collection.
*   **Tags**: Multi-select (TagSelector).
*   **Description**: Textarea.
*   **Prompt Content**: CodeEditor/Textarea - Required. Main body.
*   **Short Prompt**: CodeEditor/Textarea - Optional. (Formerly "Long Version").
*   **Usage Example**: Textarea - Optional.
*   **Variables**: List of Objects { Key: String, Description: String }.
    *   *Auto-Add Feature*: Scans content for `{{...}}` or `[[...]]` patterns.
*   **Results**:
    *   **Textual Result**: Textarea.
    *   **Result Files**: File Upload (Images/Docs).
*   **Attachments**: File Upload - General files.
*   **Resource**: Text - External URL or reference.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that `content` is required.
*   [ ] Verify "Auto-Add Variables" detects both `{{var}}` and `[[var]]` syntax.
*   [ ] Verify specific file types are accepted for uploads (images, docs, code).
*   [ ] Verify successful creation redirects to the new prompt's detail page.
*   [x] Verify that tags assigned to a prompt are visible during editing even if not in the initial optional list.

### 4. UI Wireframe Specification
**Image Source:** `assets/wireframes/prompt_create_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Two-column (or Stacked Cards).
*   **Key Elements:** Basic Info (Title, Collections), Content Editor with "Code View" toggle, Variable List with "Auto Add" button, File Upload zones.

---

## User Story: View & execute Prompt
**As a** User
**I want to** view a prompt and fill in its variables
**So that** I can generate the final string for my AI tool.

### 1. Description
Users view the prompt details, select versions, fill in dynamic variables, and copy the final result. They can also download the prompt as a Markdown file.

### 2. Technical Scope & Fields
*Derived from Code (components/PromptDetail.tsx, lib/prompt-utils.ts)*

*   **Header**: Title, Author, Date, Tags.
*   **Actions**:
    *   **Favorite**: Toggle Heart icon.
    *   **Download Markdown**: Button (FileDown icon).
    *   **Edit/Delete**: Buttons.
*   **Main Content**: Displays the prompt content.
*   **Variable Sidebar**:
    *   **Inputs**: Textarea for each unique variable detected.
    *   **Maximize**: Button to open a large modal for editing long variable values.
*   **Copy Button**: Copies content with variables replaced by user input.
*   **History**: List of previous versions.
    *   **Restore**: Button to restore an old version. Triggers a Confirmation Modal.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that typing in a variable input updates the internal state.
*   [ ] Verify "Copy" puts the interpolated string into the clipboard, replacing both `{{var}}` and `[[var]]` placeholders.
*   [ ] Verify "Download Markdown" triggers a download of `[title]_v[version].md`.
*   [ ] Verify "Restore" button creates a new version with the content of the selected old version and updates the current version reference.
*   [ ] Verify breadcrumbs show the correct collection hierarchy.

### 4. UI Wireframe Specification
**Image Source:** `assets/wireframes/prompt_detail_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** 2/3 Main Content, 1/3 Sidebar.
*   **Key Elements:**
    *   Main: Content Box (Code style), Results/Attachments cards below.
    *   Sidebar: "Fill Variables" form, Version History list.

---

## User Story: Compare Versions
**As a** User
**I want to** compare two versions of a prompt
**So that** I can see what changed.

### 1. Description
Users can select a previous version from the history list and compare it side-by-side with the currently selected version.

### 2. Technical Scope & Fields
*Derived from Code (components/VisualDiff.tsx)*

*   **Diff Modal**: Overlay showing two panes.
*   **Highlighting**: Red/Green highlights for deletions/additions.

### 3. Acceptance Criteria (AC)
*   [ ] Verify clicking the "Compare" icon (GitCompare) opens the diff view.
*   [ ] Verify differences are visually highlighted.
*   [ ] Verify "Restore" button works correctly, creating a new version from the old one and redirecting the user to it without errors.

### 4. UI Wireframe Specification
**Image Source:** `assets/wireframes/prompt_diff_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Full-screen Modal.
*   **Key Elements:** Split view (Old vs New), Close button.

