# Epic: Collections Management
**Entity:** `Collections`

This epic manages the organization of prompts into a hierarchical folder structure.

## User Stories

### 1. Create a New Collection
**As a** User
**I want to** create a new collection (folder)
**So that** I can categorize related prompts together.

**UI/UX Description:**
- **Navigation:** "+" button in the Sidebar next to "Collections" or "New Collection" page.
- **Interface:**
    - Simple form asking for `Title` (required), `Description`, and `Parent Collection` (optional dropdown/search for nesting).
    - "Create" button.

---

### 2. View Collection Hierarchy (Sidebar)
**As a** User
**I want to** see a tree view of my collections in the sidebar
**So that** I can easily navigate through nested folders.

**UI/UX Description:**
- **Interface:**
    - Sidebar component (`Sidebar.tsx`).
    - **Header:** Displays the application logo (Theme-aware: Light/Dark minimal version) and title.
    - Collections are listed as expandable tree items.
    - Clicking a caret arrow (`>`) expands/collapses children.
    - Clicking the name navigates to the Collection Detail view.
    - Uses indentation to visually represent depth level.

---

### 3. Collection Split View
**As a** User
**I want to** browse a collection in a split-pane interface
**So that** I can quickly switch between prompts in the list without navigating back and forth.

**UI/UX Description:**
- **Interface:**
    - **Resizable Split Pane:** The user can drag the border between the list and detail view.
    - **Collapsible List:** A button allows collapsing the list view entirely to focus on the detail content.
    - **Left Pane:** 
        - Breadcrumb navigation to parent collections.
        - "New Prompt" and "New Sub-collection" buttons.
        - List of Sub-collections.
        - Scrollable list of Prompts with summary cards (Title, Tags).
    - **Right Pane:** The detail view of the currently selected prompt (`PromptDetail` component) or a placeholder if none selected.
- **Responsiveness:** Adjustable width, optimized for desktop use.

![Collection View Ref](./visual_reference_collection_view_v4.png)
### 4. Edit Collection Name
**As a** User
**I want to** rename an existing collection
**So that** I can correct typos or update the category name.

**UI/UX Description:**
- **Interface:** In the Collection List / Split View header (Left Pane).
- **Interaction:**
    - Next to the collection title `Collection (x)`, a `...` (More Options) button is displayed (except for "No Collection").
    - Clicking `...` opens a small dropdown menu.
    - **Option 1:** `Rename`.
    - Clicking `Rename` replaces the title text with an inline input field and Save/Cancel buttons.
    - User types new name and confirms (Enter or Save button).

---

### 5. Delete a Collection
**As a** User
**I want to** delete a collection but keep its contents
**So that** I can remove unnecessary folders without losing my work.

**UI/UX Description:**
- **Entry Point:** The same `...` dropdown menu as "Rename".
- **Option 2:** `Delete`.
- **Interaction:**
    - Clicking `Delete` expands/shows a confirmation query within the popover: *"Delete collection? Prompts will move to parent."* with Confirm/Cancel buttons.
    - **Behavior:**
        - If confirmed, the collection is deleted.
        - **Critical Rule:** All prompts contained in this collection are **moved to the parent collection** (or become unassigned/root if no parent exists). Sub-collections might also be moved up one level.
- **Feedback:** Success notification and redirection to the parent collection (or root list).

---

### 6. Reorganize Collections (Drag and Drop)
**As a** User
**I want to** drag and drop collections in the sidebar
**So that** I can easily restructure my hierarchy (move to root or nest under another collection).

**UI/UX Description:**
- **Interaction:**
    - Click and hold a collection name in the Sidebar to drag.
    - Drag over another collection to target it as a parent.
    - Drag to a "root" area or specifically Drop on "Collections" header to make it a top-level collection.
    - Visual cues (highlighting target) during drag.
- **Backend:** Updates the `parentId` of the moved collection.
- **Rules:** Prevent moving a collection into its own descendant (circular reference).
- **Status:** Implemented.

---

### 7. System Collection: "No Collection"
**As a** User
**I want to** see a dedicated folder for unassigned prompts
**So that** I can easily find and organize new or orphaned work.

**UI/UX Description:**
- **Placement:** Always displayed as the **last item** in the root level of the Sidebar tree.
- **Name:** "No Collection" (or "Unorganized").
- **Content:** Automatically contains all prompts that do not have a `collectionId`.
- **Constraints:** 
    - **Immutable:** Cannot be renamed, deleted, or moved by the user.
    - **Drop Target:** Users can drag prompts *into* this folder to remove them from their current collection (set `collectionId` to null).
- **Count:** Displays the count of unassigned prompts like other collections `(N)`.
