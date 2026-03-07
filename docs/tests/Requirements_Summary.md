# Requirements Summary

## Epic: Advanced Workflows

### User Story: Create Workflow
**Acceptance Criteria:**
- *   [ ] Verify identifying variables in added prompts automatically.
- *   [ ] Verify that selecting "Step Output" maps the data flow correctly.
- *   [ ] Verify saving persists the mappings and order.

### User Story: Execute Workflow
**Acceptance Criteria:**
- *   [ ] Verify that variables mapped to previous steps are auto-filled.
- *   [ ] Verify that "Next Step" is disabled until output is provided.
- *   [ ] Verify that finishing the workflow displays a summary of all steps.

## Epic: Authentication & Settings

### User Story: User Registration
**Acceptance Criteria:**
- *   [ ] Verify that `username` and `email` uniqueness is checked against the database.
- *   [ ] Verify error "Email already registered" if email exists.
- *   [ ] Verify error "Username already taken" if username exists.
- *   [ ] Verify that if `GlobalConfiguration.registrationEnabled` is false, error "Registration is currently disabled by the administrator" is shown.
- *   [ ] Verify redirection to `/login?registered=true` on success.

### User Story: User Login
**Acceptance Criteria:**
- *   [ ] Verify that invalid credentials return "Invalid credentials" error.
- *   [ ] Verify successful login redirects to `/`.
- *   [ ] Verify "Account created successfully" message if `?registered=true` is present.

### User Story: General Settings
**Acceptance Criteria:**
- *   [ ] Verify that toggling "Show Prompting Tips" updates `Settings.showPrompterTips`.
- *   [ ] Verify that changing language updates the UI immediately.

### User Story: Tag Color Preferences
**Acceptance Criteria:**
- *   [ ] Verify that toggling "Enable Tag Colors" updates `Settings.tagColorsEnabled`.
- *   [ ] Verify that when enabled, tags display their assigned color.
- *   [ ] Verify that when disabled, tags display the default system color.
- *   [ ] Verify that tags in Collection Grid View respect the setting.
- *   [ ] Verify that new tags get a color assigned (either automatically or manually).

### User Story: Workflow Visibility
**Acceptance Criteria:**
- *   [ ] Verify that the default state is unchecked (Workflows hidden).
- *   [ ] Verify that checking the box updates `Settings.workflowVisible`.
- *   [ ] Verify that checking the box makes the "Workflows" link appear in the sidebar immediately.
- *   [ ] Verify that unchecking the box removes the link.

### User Story: User Visibility
**Acceptance Criteria:**
- *   [ ] Verify adding a user to the hidden list updates the `UserVisibility` relation.
- *   [ ] Verify that hidden users do not appear in relevant lists (scope dependent).

### User Story: Collapsible Sidebar System Menu
**Acceptance Criteria:**
- *   [ ] Verify that clicking the "System" header toggles the visibility of the menu items.
- *   [ ] Verify that the User Profile button remains visible and functional regardless of the system menu state.
- *   [ ] Verify that the state (expanded/collapsed) is consistent during the session.

### User Story: Admin Management (Global & Users)
**Acceptance Criteria:**
- *   [ ] Verify disabling registration prevents new sign-ups.
- *   [ ] Verify toggling "Enable Private Prompts" updates the database value.
- *   [ ] Verify that disabling "Private Prompts" shows a confirmation dialog: "Are you sure? This will hide all private prompts...".
- *   [ ] Verify that when disabled, the option to create/edit private prompts is hidden in the UI.
- *   [ ] Verify "Add User" creates a user entry in the table immediately.
- *   [ ] Verify toggling role updates the user's permission level.
- *   [ ] Verify clicking "Delete" opens a confirmation dialog.
- *   [ ] Verify confirming delete removes the user from the database and UI.
- *   [ ] Verify Admin cannot delete themselves (optional but recommended safety).

### User Story: Private Prompt Visibility
**Acceptance Criteria:**
- *   [ ] Verify "Private Prompt" checkbox is hidden during creation/editing if global setting is disabled.
- *   [ ] Verify "Eye Icon" (Make Private/Public) is hidden on prompt detail page if global setting is disabled.
- *   [ ] Verify existing private prompts are NOT accessible/visible if global setting is disabled (Optional: or just hidden from lists).

## Epic: Collections & Tags

### User Story: Create Collection
**Acceptance Criteria:**
- *   [ ] Verify that selecting a parent creates a nested structure.
- *   [ ] Verify "Title" is required.
- *   [ ] Verify successful creation updates the sidebar list.

### User Story: Sidebar Navigation & Organization
**Acceptance Criteria:**
- *   [ ] Verify clicking the chevron toggles the section visibility.
- *   [ ] Verify dragging a collection onto another nests it.
- *   [ ] Verify "Unassigned" count matches the number of orphan prompts.

### User Story: Sorting Control
**Acceptance Criteria:**
- *   [ ] Verify that clicking an option updates the URL search params (`?sort=x&order=y`).
- *   [ ] Verify the active sort option shows a checkmark.

### User Story: Collection Detail Grid View
**Acceptance Criteria:**
- *   [ ] Verify that clicking a collection name (without selecting a prompt) shows the grid view.
- *   [ ] Verify that the grid view contains `PromptCard` components.
- *   [ ] Verify that `PromptCard` shows thumbnails and stats correctly (requires data fetch update).
- *   [ ] Verify "Favorite" (Heart) icon reflects the user's current favorite status for each prompt.
- *   [ ] Verify clicking the "Favorite" icon toggles the status ONLY for the specific card clicked, and updates the icon state immediately.
- *   [ ] Verify that opening a collection shows the correct favorite state for all prompts (persistence check).
- *   [ ] Verify clicking the "Favorite" icon toggles the status correctly without affecting other items.
- *   [ ] Verify that selecting a prompt from the sidebar (or clicking a card) opens the `PromptDetail` view.

### User Story: Bulk Actions for Prompts
**Acceptance Criteria:**
- *   [ ] Verify "Change multiple..." toggles selection mode.
- *   [ ] Verify checkboxes appear for each prompt.
- *   [ ] Verify multi-selection works (checking/unchecking).
- *   [ ] Verify dragging a selection group to a sidebar collection updates the `collectionId` for all selected prompts.
- *   [ ] Verify "Add Tags" functionality applies selected tags to all checked prompts.
- *   [ ] Verify "Select All" selects all visible prompts.
- *   [ ] Verify "Deselect All" clears the selection.
- *   [ ] Verify "Cancel" exits the mode.

### User Story: Collection Context Menus
**Acceptance Criteria:**
- *   [ ] Verify context menu appears for collections.
- *   [ ] Verify "New Prompt" redirects correctly.
- *   [ ] Verify "Add Sub-collection" redirects correctly.

### User Story: Collection Tree Visibility
**Acceptance Criteria:**
- *   [ ] Verify collections are displayed in a tree.
- *   [ ] Verify clicking expanding arrow shows children.
- *   [ ] Verify indentation represents depth.

### User Story: Settings - Hide Collections
**Acceptance Criteria:**
- *   [ ] Verify "Collection Visibility" section exists in Settings.
- *   [ ] Verify checking a collection adds it to the hidden list.
- *   [ ] Verify hidden collections do not appear in the main sidebar or collection list (unless a "Show Hidden" toggle is active, if applicable).

## Epic: Data Management

### User Story: Import Data
**Acceptance Criteria:**
- *   [ ] Verify Unified Import accepts valid TMT JSON (array).
- *   [ ] Verify Unified Import accepts valid PromptCat JSON (object/array).
- *   [ ] **AC_NEW:** Verify Unified Import accepts legacy JSON formats (e.g. string tags, missing optional fields) without error.
- *   [ ] **AC_NEW:** Verify flat import structure correctly maps `variableDefinitions`, `resultText`, and `usageExample` to the created prompt.
- *   [ ] Verify Unified Import reconstructs the nested collection tree structure from `definedCollections`.
- *   [ ] **AC8:** Verify imported prompts are correctly linked to their restored parent collections in the database and visible in the UI.
- *   [ ] Verify proper progress bar is shown during import (identical UI to export).
- *   [ ] Verify Scraper extracts prompts and allows selective import.
- *   [ ] Verify Scraper copy button uses compact icon style to preserve layout space.

### User Story: Export Data
**Acceptance Criteria:**
- *   [ ] Verify clicking button triggers a download of `prompts.json` (or similar).
- *   [ ] **AC2:** The export file should be named `TMT-backup-[DATE].json`.
- *   [ ] **AC3:** The export can be filtered by selecting specific collections via a Tree View interface.
- *   [ ] **AC4:** Granular selection options: "Select All", "Deselect All", and individual collection checkboxes.
- *   [ ] **AC5:** Exported JSON must include `definedCollections` array describing the hierarchy (parent/child relationships).
- *   [ ] **AC6:** UI must show a progress bar during the export process.
- *   [ ] **AC7:** Upon completion, show a translated message: "Export complete: X prompts exported."
- *   [ ] Verify generated JSON matches the specific TMT Zero schema.
- *   [ ] **AC1:** The export interface displays collections in a collapsible Tree View.
- *   [ ] **AC2:** Each collection has a checkbox.
- *   [ ] **AC3:** "Select All" and "Deselect All" buttons are available.
- *   [ ] **AC4:** Export generates a JSON file containing only prompts from the selected collections.

### User Story: Export for TMT Zero
**Acceptance Criteria:**
- *   [ ] Verify user can select/deselect collections.
- *   [ ] Verify "Select All" toggles all checkboxes.
- *   [ ] Verify generated JSON matches the specific TMT Zero schema.
- *   [ ] Verify only prompts within selected collections are exported.

### User Story: Auto-Backup Configuration (Moved from Settings)
### User Story: Danger Zone (Moved from Settings)
**Acceptance Criteria:**
- *   [ ] Verify these sections are visible ONLY to Admins.
- *   [ ] Verify destructive actions require explicit confirmation.

## Epic: Prompt Management

### User Story: Create Prompt
**Acceptance Criteria:**
- *   [ ] Verify that `content` is required.
- *   [ ] Verify "Auto-Add Variables" detects both `{{var}}` and `[[var]]` syntax.
- *   [ ] Verify specific file types are accepted for uploads (images, docs, code).
- *   [ ] Verify successful creation redirects to the new prompt's detail page.
- *   [x] Verify that tags assigned to a prompt are visible during editing even if not in the initial optional list.
- *   [x] Verify that adding/removing tags does not clear or reset other form fields (e.g., Description).
- *   [x] Verify that saving a prompt (create/edit) redirects to the prompt detail page and expands the parent collection in the sidebar.
- *   [ ] Verify uploaded attachments display their original filename (without internal system prefixes) in the file list.

### User Story: View & execute Prompt
### User Story: Compare Versions
**Acceptance Criteria:**
- *   [ ] Verify clicking the "Compare" icon (GitCompare) opens the diff view.
- *   [ ] Verify differences are visually highlighted.
- *   [ ] Verify "Restore" button works correctly, creating a new version from the old one and redirecting the user to it without errors.
- *   [ ] Verify deleting a prompt from a Collection context (e.g. Split View) stays in that Collection instead of redirecting to Dashboard.

### User Story: Lock Prompt
**Acceptance Criteria:**
- *   [ ] Verify Lock/Unlock toggles the `isLocked` state in DB.
- *   [ ] Verify Only Creator can Click the Lock icon.
- *   [ ] Verify **Creator** sees Edit/Delete buttons disabled when Locked.
- *   [ ] Verify **Non-Creator** sees Edit/Delete buttons disabled when Locked.
- *   [ ] Verify Creator must Unlock to edit.

### User Story: Private Prompts
**Acceptance Criteria:**
- *   [ ] A "Private Prompt" checkbox is available on the "New Prompt" form.
- *   [ ] A "Private Prompt" checkbox is available on the "Edit Prompt" form.
- *   [ ] When checked, the new prompt/version preserves the private state.
- *   [ ] Created private prompts display a "Private" badge/icon in the list view (if visible) and detail view.
- *   [ ] Private prompts are NOT visible to other users (unless Admin).
- *   [ ] Creators can toggle visibility from the Detail View via an "Eye" icon.
- *   [ ] Verify Admin can toggle the global setting.

### User Story: Import Prompts
**Acceptance Criteria:**
- *   [ ] Verify valid JSON is parsed correctly.
- *   [ ] Verify collections are created/restored if defined in V2.
- *   [x] Verify that after import completes, the Sidebar Collections menu automatically refreshes to show new items.

### User Story: Export Collection (Sidebar)
**Acceptance Criteria:**
- *   [ ] Verify "..." menu appears on hover or always for collections.
- *   [ ] Verify "Export" option is available.
- *   [ ] Verify clicking Export downloads a file named `[collection_name].json` (or verify csv if feasible, but JSON preferred for importability).
- *   [ ] Verify the exported file contains the collection, its subcollections, and all prompts within them.
- *   [ ] Verify the exported file can be imported back into the system.

### User Story: Link Related Prompts
**Acceptance Criteria:**
- *   [ ] Verify user can search for a prompt to link (excluding self).
- *   [ ] Verify linking a prompt adds it to the "Related Prompts" list.
- *   [ ] Verify unlinking removes it from the list immediately without a confirmation popup.
- *   [ ] Verify the link is visible on both prompts (A shows B, B shows A).
- *   [x] Verify that the 'Related Prompts' section correctly merges both outgoing (relatedPrompts) and incoming (relatedToPrompts) links.
- *   [ ] Verify "Related Prompts" section appears at the bottom of the details page (latest pane).
- *   [ ] **Visual Style**: Verify related prompts are displayed as cards in a single row with horizontal scrolling when overflowing, using the standard PromptCard styling.
- *   [x] **Search Filter**: Verify user cannot see already linked prompts in the search results when trying to link a new prompt.
- *   [ ] **Localization**: Verify all labels (`actions.linkPrompt`, `placeholders.searchPrompts`, `labels.relatedPrompts`) are localized for EN, NL, FR.

## Epic: Responsive Design Overhaul

## Epic: Search & Discovery

### User Story: Advanced Search
**Acceptance Criteria:**
- *   [ ] Verify that pressing Enter triggers the search.
- *   [ ] Verify that opening the filter panel reveals advanced options.
- *   [ ] Verify "Clear" resets all fields.
- *   [ ] Verify searching by Technical ID (e.g. UNAS-123) retrieves the specific prompt.

### User Story: Command Palette
**Acceptance Criteria:**
- *   [ ] Verify `Ctrl+K` opens the palette.
- *   [ ] Verify searching for "Dark" shows the "Toggle Theme" option.
- *   [ ] Verify clicking an action performs the expected navigation.

## Epic: Technical IDs for Prompts/Skills

