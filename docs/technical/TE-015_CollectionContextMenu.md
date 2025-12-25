# Technical Implementation: Collection Context Menu & Actions

## Overview
Implementation of a context menu for sidebar collection items to provide quick access to common actions (New Prompt, New Sub-collection, Edit, Delete).

## 1. Components

### `components/CollectionContextMenu.tsx`
*   **Props**: `isOpen`, `onClose`, `collectionId`, `isOwner`.
*   **Behavior**:
    *   Renders a portal or absolute positioned menu (Popover/Dropdown).
    *   Closes on outside click.
    *   Provides navigation links to:
        *   `/prompts/new?collectionId={id}`
        *   `/collections/new?parentId={id}`
        *   `/collections/{id}?action=edit` (Triggers edit mode in `CollectionSplitView`)
        *   Delete action (can link to detail with delete intent or open dialog).

### `components/Sidebar.tsx`
*   **Integration**:
    *   `CollectionTreeItem` renders the context menu trigger ("..." button) on hover.
    *   State `isMenuOpen` tracks menu visibility per item.
    *   Passes `currentUserId` down the tree to determine `isOwner` for permission checks.

### `components/CollectionSplitView.tsx`
*   **Edit Integration**:
    *   Listens to `searchParams.get('action') === 'edit'`.
    *   Sets `isEditing(true)` when detected.
    *   Allows seamless transition from context menu to edit mode.

## 2. API / Actions

### Routes
*   **GET /collections/[id]?action=edit**: Opens collection detail in edit mode.

## 3. Security
*   **Ownership Check**: Context menu only shows "Edit" and "Delete" options if `currentUserId` matches `collection.ownerId`.
*   **Server-Side Validation**: Actions (`updateCollectionDetails`, `deleteCollection`) verify ownership again on the server.
