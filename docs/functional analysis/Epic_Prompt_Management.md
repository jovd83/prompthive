---
title: Epic_Prompt_Management
version: 2.3.4
last_updated: 2026-01-11
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
*   **Tags**: Multi-select (TagSelector). Tags can be colored if enabled in settings.
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
*   [ ] Verify uploaded attachments display their original filename (without internal system prefixes) in the file list.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/editor_wireframe.png`

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

*   **Header**: Title, Technical ID (in a rectangle/badge, e.g., REVI-123), Counters (Viewed, Copied), Author, Date, Tags (Colored if enabled).
*   **Acceptance Criteria Updated**:
    *   [x] Verify tags are displayed with their assigned colors if `tagColorsEnabled` is true.
    *   [x] Verify Guest users see Edit/Delete buttons disabled (or locked state).
    *   [ ] Verify Guest users cannot drag prompt cards (draggable attribute is disabled).
    *   [ ] Verify Guest users cannot toggle Favorites (Heart icon disabled).
    *   [ ] Verify attachments and result files display the original filename (e.g., "my-file.txt") and not the internal system name (e.g. "123456-my-file.txt").
*   **Actions**:
    *   **Favorite**: Toggle Heart icon.
    *   **Visibility Toggle**: Eye icon (Public) / EyeOff icon (Private). **Creator Only**.
    *   **Download Markdown**: Button (FileDown icon).
    *   **Edit/Delete**: Buttons.
*   **Main Content**: Displays the prompt content.
*   **Variable Sidebar**:
    *   **Inputs**: Textarea for each unique variable detected.
*   **Tag Display**:
    *   [x] Verify tags are displayed in a single line by default, utilizing the full available width.
    *   [x] Verify "View all tags" button appears immediately after the last visible tag if overflow occurs.
    *   [x] Verify the "View all tags" button is localized (EN, NL, FR).
    *   [x] Verify clicking expand button reveals all tags on multiple lines.
    *   [x] Verify collapsed state strictly enforces single-line height (no partial second row visible).

**Image Source:** `../wireframes/previews/prompt_detail_wireframe.png`

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
*   [ ] Verify deleting a prompt from a Collection context (e.g. Split View) stays in that Collection instead of redirecting to Dashboard.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/visual_diff_wireframe.png`

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
            *   Disable Delete Button (For Everyone).
            *   Disable "Save New Version" (Backend).
            *   Disable updating Metadata (Backend).
        *   Unlock: Only Creator can unlock.

### 3. Acceptance Criteria (AC)
*   [ ] Verify Lock/Unlock toggles the `isLocked` state in DB.
*   [ ] Verify Only Creator can Click the Lock icon.
*   [ ] Verify **Creator** sees Edit/Delete buttons disabled when Locked.
*   [ ] Verify **Non-Creator** sees Edit/Delete buttons disabled when Locked.
*   [ ] Verify Creator must Unlock to edit.

---

## User Story: Private Prompts
**As a** User
**I want to** make my prompt private
**So that** only I can see and use it.

### 1. Description
Users can toggle a "Private Prompt" checkbox when creating or editing a prompt. This field is only available if the global "Private Prompts" setting is enabled by an Admin.
When private, the prompt is visible **only** to the creator. It does not appear in search results, collections, or dashboards for other users.

### 2. Technical Scope & Fields
*   **Global Config**: `privatePromptsEnabled` (Boolean).
*   **Prompt Model**: `isPrivate` (Boolean).
*   **UI**:
    *   **Admin Settings**: Toggle to enable/disable feature.
    *   **Prompt Editor**: Checkbox "Private Prompt" (default unchecked).
    *   **Prompt Detail**: Badge "Private" visible to owner.
    *   **Prompt Detail Actions**: Eye/EyeOff toggle button for Creator.

### 3. Acceptance Criteria
*   [ ] A "Private Prompt" checkbox is available on the "New Prompt" form.
*   [ ] A "Private Prompt" checkbox is available on the "Edit Prompt" form.
*   [ ] When checked, the new prompt/version preserves the private state.
*   [ ] Created private prompts display a "Private" badge/icon in the list view (if visible) and detail view.
*   [ ] Private prompts are NOT visible to other users (unless Admin).
*   [ ] Creators can toggle visibility from the Detail View via an "Eye" icon.
    *   Eye Icon (Open) = Public
    *   Eye Icon (Strikethrough) = Private
    *   Toggling updates the `isPrivate` status immediately. other users (Search, sidebar, collections).
*   [ ] Verify Admin can toggle the global setting.

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

---

## User Story: Link Related Prompts
**As a** User
**I want to** link prompts to each other
**So that** I can group related ideas or navigate between connected workflows.

### 1. Description
Users can search for and link other prompts to the current prompt. These appear as "Related Prompts" cards in the detail view. The relationship is bidirectional in concept (if A links B, B links A), but may be implemented as a simple many-to-many.

### 2. Technical Scope
*   **Data Model**: Many-to-Many self-relation on `Prompt`.
*   **UI**:
    *   **Related Prompts Section**: Grid of small cards (showing Title, ID, Status) in `PromptDetail`.
    *   **Link Action**: Button to open a "Link Prompt" modal.
    *   **Link Modal**: Search input (Title/ID) with autocomplete, list of candidates, and "Link" button.
    *   **Unlink Action**: "Unlink" button/icon on the related prompt card.

### 3. Acceptance Criteria
*   [ ] Verify user can search for a prompt to link (excluding self).
*   [ ] Verify linking a prompt adds it to the "Related Prompts" list.
*   [ ] Verify unlinking removes it from the list immediately without a confirmation popup.
*   [ ] Verify the link is visible on both prompts (A shows B, B shows A).
*   [x] Verify that the 'Related Prompts' section correctly merges both outgoing (relatedPrompts) and incoming (relatedToPrompts) links.
*   [ ] Verify "Related Prompts" section appears at the bottom of the details page (latest pane).
*   [ ] **Visual Style**: Verify related prompts are displayed as cards in a single row with horizontal scrolling when overflowing, using the standard PromptCard styling.
*   [x] **Search Filter**: Verify user cannot see already linked prompts in the search results when trying to link a new prompt.
*   [ ] **Localization**: Verify all labels (`actions.linkPrompt`, `placeholders.searchPrompts`, `labels.relatedPrompts`) are localized for EN, NL, FR.
