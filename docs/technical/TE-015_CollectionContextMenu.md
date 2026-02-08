# Technical Implementation: Collection Context Menu & Actions

## Overview
Implementation of a context menu for sidebar collection items to provide quick access to common actions (New Prompt, New Sub-collection, Edit, Delete). Modified to support batched deletion with progress feedback.

## 1. Components

### `components/CollectionSidebar.tsx`
*   **Props**: `collection`, `currentUserId`.
*   **Behavior for Deletion**:
    *   **Orchestration**: Instead of a single server action, the client orchestrates the deletion:
        1.  Calls `getCollectionDescendantsAction(id)` to retrieve all prompt IDs to be deleted.
        2.  Calculates total items.
        3.  Calls `bulkDeletePrompts(ids)` in batches (e.g., 20 items per batch) to update a client-side progress bar.
        4.  Finally calls `deleteCollection(id)` to remove the empty containers.
    *   **Feedback**: Renders a progress bar inline or in a modal during the process.

## 2. API / Actions

### Actions
*   `actions/collections.ts`:
    *   `getCollectionDescendantsAction`: Returns recursive list of prompt IDs and collection IDs.
    *   `deleteCollection`: Remains final step to cleanup structure.
*   `actions/prompts.ts`:
    *   `bulkDeletePrompts`: Deletes a list of prompts.

## 3. Security
*   **Ownership Check**: Context menu only shows "Edit" and "Delete" options if `currentUserId` matches `collection.ownerId`.
*   **Server-Side Validation**: All actions verify ownership again on the server.
