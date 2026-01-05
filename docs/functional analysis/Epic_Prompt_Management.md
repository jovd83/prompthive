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
*   **Description**: **Expandable** Textarea.
*   **Prompt Content**: CodeEditor/Textarea - Required. Main body. **Expandable** in non-code view.
*   **Short Prompt**: CodeEditor/Textarea - Optional. **Expandable** in non-code view.
*   **Usage Example**: **Expandable** Textarea - Optional.
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
*   [x] Verify that adding/removing tags does not clear or reset other form fields (e.g., Description).
*   [x] Verify that saving a prompt (create/edit) redirects to the prompt detail page and expands the parent collection in the sidebar.

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

---

## User Story: Lock Prompt
**As a** Creator
**I want to** lock my prompt for others
**So that** nobody else can edit it by accident.

### 1. Description
The creator of a prompt can toggle a "Lock" status (padlock icon). When closed (locked), **NO ONE** can edit the prompt (including the creator). To edit, the creator must first Unlock it.

### 2. Technical Scope & Fields
*   **Prompt Model**: New boolean field `isLocked` (default false).
*   **UI**:
    *   Lock Icon Button in Prompt Detail header.
    *   Visual state: Open Padlock (Unlocked) vs Closed Padlock (Locked).
    *   Permission Logic:
        *   If `isLocked` == true:
            *   Disable Edit Button (For Everyone).
            *   Disable "Save New Version" (Backend).
            *   Disable updating Metadata (Backend).
        *   Unlock: Only Creator can unlock.

### 3. Acceptance Criteria (AC)
*   [ ] Verify Lock/Unlock toggles the `isLocked` state in DB.
*   [ ] Verify Only Creator can Click the Lock icon.
*   [ ] Verify **Creator** sees Edit/Save buttons disabled when Locked.
*   [ ] Verify Non-Creator sees Edit/Save buttons disabled when Locked.
*   [ ] Verify Creator must Unlock to edit.

---

## User Story: Import Prompts
**As a** User
**I want to** import prompts from a JSON file
**So that** I can restore backups or migrate data.

### 1. Description
Users can upload a JSON file containing prompts (standard or legacy format). The system parses it, creates collections if needed (V2), and imports prompts.

### 2. Technical Scope & Fields
*   **Input**: JSON File.
*   **Actions**:
    *   **Unified Import**: Handles single, array, and V2 structure.
    *   **Batch Processing**: Client-side batching invokes server action.

### 3. Acceptance Criteria (AC)
*   [ ] Verify valid JSON is parsed correctly.
*   [ ] Verify collections are created/restored if defined in V2.
*   [x] Verify that after import completes, the Sidebar Collections menu automatically refreshes to show new items.

---

## User Story: Export Collection (Sidebar)
**As a** User
**I want to** export a specific collection from the sidebar menu
**So that** I can share or backup just that part of my library.

### 1. Description
Users can open a context menu ('...') next to a collection in the sidebar and select "Export". This generates a download of the collection and its contents in an importable format (JSON). Note: User request mentioned CSV, but system standard for recursive import is JSON V2. Implementation will prioritize "importable result" (JSON V2) to ensure compatibility.

### 2. Technical Scope
*   **UI**: Add '...' menu to `CollectionTreeItem` in `Sidebar.tsx`.
*   **Action**: "Export Collection" triggers client-side generation of V2 JSON for that collection and its children.
*   **Logic**:
    *   Fetch all descendant prompt IDs.
    *   Fetch prompt details.
    *   Construct V2 JSON.
    *   Trigger download.

### 3. Acceptance Criteria
*   [ ] Verify "..." menu appears on hover or always for collections.
*   [ ] Verify "Export" option is available.
*   [ ] Verify clicking Export downloads a file named `[collection_name].json` (or verify csv if feasible, but JSON preferred for importability).
*   [ ] Verify the exported file contains the collection, its subcollections, and all prompts within them.
*   [ ] Verify the exported file can be imported back into the system.