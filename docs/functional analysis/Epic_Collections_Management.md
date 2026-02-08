---
title: Epic_Collections_Management
version: 2.2
last_updated: 2025-12-23
status: Live
---

# Epic: Collections & Tags

## User Story: Create Collection
**As a** User
**I want to** organize my prompts into folders
**So that** I can keep my workspace structured.

### 1. Description
Users can create nested collections (folders) to organize their prompts.

### 2. Technical Scope & Fields
*Derived from Code (components/CreateCollectionForm.tsx)*

*   **Parent Collection**: Dropdown - Options: Root (No Parent) or Existing Collections.
*   **Title**: Text - Required.
*   **Description**: Textarea - Optional.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that selecting a parent creates a nested structure.
*   [ ] Verify "Title" is required.
*   [ ] Verify successful creation updates the sidebar list.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/collection_create.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Simple Form Card.
*   **Key Elements:** Parent Dropdown, Title Input, Description Textarea, "Create" Button.

---

## User Story: Sidebar Navigation & Organization
**As a** User
**I want to** navigate my collections and tags efficiently
**So that** I can find content without clutter.

### 1. Description
The sidebar displays a hierarchical tree of collections and a list of tags. Both sections are collapsible. Users can drag and drop collections to nest them.

### 2. Technical Scope & Fields
*Derived from Code (components/Sidebar.tsx)*

*   **Collections Tree**: Recursive tree view.
    *   **Expand/Collapse**: Chevron icons for parents.
    *   **Drag & Drop**: Supports `data-collectionId`.
    *   **Sorting**: Menu (...) - Options: A-Z, Z-A, Newest, Oldest, Count.
*   **Tags List**: Flex list of tags.
    *   **Collapsible**: Chevron icon to toggle visibility.
    *   **Sorting**: Menu (...) - Options: A-Z, Z-A, Newest, Oldest, Count.
*   **Unassigned**: Auto-generated link for prompts with no collection.

### 3. Acceptance Criteria (AC)
*   [ ] Verify clicking the chevron toggles the section visibility.
*   [ ] Verify dragging a collection onto another nests it.
*   [ ] Verify "Unassigned" count matches the number of orphan prompts.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/collection_sidebar_update.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Sidebar Component.
*   **Key Elements:** Collapsible headers ("COLLECTIONS", "TAGS"), Sort Menus (...), Search Bar, User Profile.

---

## User Story: Sorting Control
**As a** User
**I want to** sort lists of prompts
**So that** I can find specific items quickly.

### 1. Description
A unified sorting control (dropdown menu) allows users to order lists by name or date.

### 2. Technical Scope & Fields
*Derived from Code (components/SortControls.tsx)*

*   **Trigger**: "..." (MoreHorizontal) Icon Button.
*   **Menu Options**:
    *   A - Z (`alpha + asc`)
    *   Z - A (`alpha + desc`)
    *   Newest first (`date + desc`)
    *   Oldest first (`date + asc`)

### 3. Acceptance Criteria (AC)
*   [ ] Verify that clicking an option updates the URL search params (`?sort=x&order=y`).
*   [ ] Verify the active sort option shows a checkmark.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/dashboard_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Popover Menu.
*   **Key Elements:** List of sort options with Check icons for active state.


---

## User Story: Collection Detail Grid View
**As a** User
**I want to** see a grid of prompt cards when I select a collection
**So that** I can browse my collection visually just like the dashboard.

### 1. Description
When a user selects a collection from the sidebar, the main pane (right side) should display a grid of prompt cards for all prompts in that collection, similar to the main dashboard view. This triggers when no specific prompt is selected within the collection.

### 2. Technical Scope & Fields
*Derived from Code (components/CollectionSplitView.tsx)*

*   **View**: Grid Layout (Responsive).
*   **Components**: Reuses `PromptCard`.
*   **Condition**: Rendered when `selectedPrompt` is null.
*   **Data**: Requires fetching full prompt details (including images/stats) for the collection list.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that clicking a collection name (without selecting a prompt) shows the grid view.
*   [ ] Verify that the grid view contains `PromptCard` components.
*   [ ] Verify that `PromptCard` shows thumbnails and stats correctly (requires data fetch update).
*   [ ] Verify "Favorite" (Heart) icon reflects the user's current favorite status for each prompt.
*   [ ] Verify clicking the "Favorite" icon toggles the status ONLY for the specific card clicked, and updates the icon state immediately.
*   [ ] Verify that opening a collection shows the correct favorite state for all prompts (persistence check).
*   [ ] Verify clicking the "Favorite" icon toggles the status correctly without affecting other items.
*   [ ] Verify that selecting a prompt from the sidebar (or clicking a card) opens the `PromptDetail` view.

### 4. UI Wireframe Specification
*   **Layout**: Grid of Cards.
*   **Reference**: Same visual style as Dashboard.

---

## User Story: Bulk Actions for Prompts
**As a** User
**I want to** select multiple prompts in a collection
**So that** I can organize them or tag them in bulk.

### 1. Description
Users can enter a "selection mode" within a collection to select multiple prompts. Once selected, users can drag the group to another collection or apply tags to all selected items simultaneously.

### 2. Technical Scope & Fields
*Derived from Code (components/CollectionSplitView.tsx)*

*   **Trigger**: "Change multiple..." option in the Collection Menu (...).
*   **UI State**: 'Selection Mode' - Displays checkboxes next to each prompt in the list.
*   **Actions**:
    *   **Select All**: Button to select all currently visible prompts.
    *   **Deselect All**: Button to clear the current selection.
    *   **Move**: Drag and drop the selected group to a collection in the sidebar.
    *   **Add Tags**: Button to open a tag selector and apply chosen tags to all selected prompts.
    *   **Cancel**: Button to exit selection mode and clear selection.

### 3. Acceptance Criteria (AC)
*   [ ] Verify "Change multiple..." toggles selection mode.
*   [ ] Verify checkboxes appear for each prompt.
*   [ ] Verify multi-selection works (checking/unchecking).
*   [ ] Verify dragging a selection group to a sidebar collection updates the `collectionId` for all selected prompts.
*   [ ] Verify "Add Tags" functionality applies selected tags to all checked prompts.
*   [ ] Verify "Select All" selects all visible prompts.
*   [ ] Verify "Deselect All" clears the selection.
*   [ ] Verify "Cancel" exits the mode.

### 4. UI Wireframe Specification
*   **Mode**: Selection Mode Overlay/State.
*   **Key Elements**: Checkboxes list, "Selected (n)" indicator, "Add Tags" button.

---

## User Story: Collection Context Menus
**As a** User
**I want to** access actions directly from the collection sidebar item
**So that** I can manage my collections and prompts more efficiently.

### 1. Description
Each collection in the sidebar should have a context menu (accessible via '...' icon or similar) that provides quick actions relative to that collection.

### 2. Technical Scope & Fields
*Derived from Code (components/Sidebar.tsx)*

*   **Trigger**: "..." Icon on hover (or permanent).
*   **Menu Options**:
    *   **New Prompt**: Navigates to create prompt with this collection pre-selected.
    *   **Add Sub-collection**: Navigates to create collection with this parent pre-selected.
    *   **Edit Collection**: Open dialog/navigate to edit name/desc. (Available to Owner/Admin)
    *   **Delete**: Prompt for confirmation. (Available to Owner/Admin)
        *   Option to "Delete everything" must recursively delete all child collections and prompts.
        *   **Feedback**: For large collections, a progress bar must be displayed during deletion.
        *   Option to "Keep contents" moves all children and prompts to the parent collection.

### 3. Acceptance Criteria (AC)
*   [ ] Verify context menu appears for collections.
*   [ ] Verify "New Prompt" redirects correctly.
*   [ ] Verify "Add Sub-collection" redirects correctly.

---

## User Story: Collection Tree Visibility
**As a** User
**I want to** view my collections as a hierarchical tree
**So that** I can easily navigate deeply nested structures.

### 1. Description
The main collections page should display collections in a collapsible tree structure instead of (or in addition to) the grid view. This allows users to see the hierarchy at a glance.

### 2. Technical Scope & Fields
*   **Component**: `CollectionTree`
*   **Behavior**:
    *   Expand/Collapse nodes.
    *   Show collection name and prompt count.
    *   Indicate hidden status (if owner).

### 3. Acceptance Criteria (AC)
*   [ ] Verify collections are displayed in a tree.
*   [ ] Verify clicking expanding arrow shows children.
*   [ ] Verify indentation represents depth.

---

## User Story: Settings - Hide Collections
**As a** User
**I want to** hide specific collections from my main view
**So that** I can focus on what is relevant and hide archival/unused structures.

### 1. Description
In the Settings area, users can see a tree of all collections and toggle their visibility. Hiding a parent collection should optionally hide or collapse its children in the main view.

### 2. Technical Scope & Fields
*   **Settings Section**: "Collection Visibility".
*   **Data**: Stored in `Settings` -> `hiddenCollections` relation.
*   **UI**: Checkbox tree. Unchecked = Visible, Checked = Hidden (or vice versa, typically "Select to Hide" or "Select to Show").
    *   *Decision*: "Select to Hide" matches "Hidden Users" pattern.

### 3. Acceptance Criteria (AC)
*   [ ] Verify "Collection Visibility" section exists in Settings.
*   [ ] Verify checking a collection adds it to the hidden list.
*   [ ] Verify hidden collections do not appear in the main sidebar or collection list (unless a "Show Hidden" toggle is active, if applicable).
