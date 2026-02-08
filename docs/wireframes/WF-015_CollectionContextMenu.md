# Wireframe: Collection Context Menu

## Overview
This wireframe describes the Context Menu accessible from the Sidebar for each Collection.

### 1. Trigger
*   **Element**: Collection Item in Sidebar.
*   **Interaction**: Hovering reveals a "..." (More) icon button on the right side of the item. Clicking it opens the menu.

### 2. Menu Options
A dropdown/popover menu appears with the following options:

1.  **New Prompt** (Plus Icon)
    *   **Action**: Navigates to `/prompts/new` with `collectionId` pre-filled.
2.  **New Collection** (FolderPlus Icon)
    *   **Action**: Navigates to `/collections/new` with `parentId` pre-filled.
3.  **Edit Collection** (Edit2 Icon) - *Owner Only*
    *   **Action**: Navigates to Collection Detail with `?action=edit`, triggering the edit mode.
4.  **Delete** (Trash2 Icon) - *Owner Only*
    *   **Action**: Switches the menu content to a confirmation state.
    *   **State 1 (Confirmation)**:
        *   "Delete Collection Only" (Move contents to parent)
        *   "Delete Everything" (Recursive delete)
        *   "Cancel"
    *   **State 2 (Progress)**:
        *   Displays a **Progress Bar** indicating deletion status (e.g., "Deleting prompts... 45/120").
        *   Buttons are disabled.

### 3. Visuals
*   **Style**: Standard Shadcn/UI Popover or similar.
*   **Animation**: Fade in/out.
