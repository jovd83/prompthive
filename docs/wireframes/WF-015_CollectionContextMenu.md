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
    *   **Action**: Navigates to Collection Detail (or opens delete dialog directly if implemented, currently redirects to detail with delete menu available).
    *   *Note*: To prevent accidental deletions via sidebar, we direct users to the detail view where a more robust delete flow exists, OR we could add a confirmation dialog here. Current implementation routes to detail or edit.

### 3. Visuals
*   **Style**: Standard Shadcn/UI Popover or similar.
*   **Animation**: Fade in/out.
