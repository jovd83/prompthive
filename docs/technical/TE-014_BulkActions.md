# Technical Plan: Bulk Actions for Prompts

## Overview
Implement bulk actions (move and add tags) for prompts within the Collection view.

## 1. Backend Implementation

### `services/prompts.ts`
*   **`bulkMovePromptsService(userId: string, promptIds: string[], collectionId: string | null)`**
    *   Verify user has access to all prompts.
    *   Use `prisma.prompt.updateMany` if possible, but since `collections` is a relation, might need `prisma.$transaction` with loop updates or specific `connect`/`set` logic.
    *   Actually `updateMany` doesn't support relations.
    *   Use `prisma.$transaction`:
        ```typescript
        await prisma.$transaction(
             promptIds.map(id => prisma.prompt.update({
                 where: { id },
                 data: {
                     collections: collectionId ? { set: [{ id: collectionId }] } : { set: [] }
                 }
             }))
        );
        ```

*   **`bulkAddTagsService(userId: string, promptIds: string[], tagIds: string[])`**
    *   Add tags to prompts without removing existing ones.
    *   Use `prisma.$transaction`:
        ```typescript
        await prisma.$transaction(
             promptIds.map(id => prisma.prompt.update({
                 where: { id },
                 data: {
                     tags: { connect: tagIds.map(tId => ({ id: tId })) }
                 }
             }))
        );
        ```

### `actions/prompts.ts`
*   **`bulkMovePrompts(promptIds: string[], collectionId: string | null)`**
    *   Auth check.
    *   Call service.
    *   Revalidate paths.
*   **`bulkConfigureTags(promptIds: string[], tagIds: string[])`**
    *   Auth check.
    *   Call service.
    *   Revalidate paths.

## 2. Frontend Implementation

### `components/CollectionSplitView.tsx`
*   State: `isSelectionMode` (bool), `selectedPromptIds` (Set<string>).
*   **Menu**:
    *   Add "Change multiple..." button.
    *   Toggles `isSelectionMode`.
*   **Selection Mode UI**:
    *   **Header**: Replace standard header with Selection Header (Count, Add Tags Button, Cancel).
    *   **List Items**: Pass `isSelectionMode` and `isChecked` to `CollectionPromptListItem`. Render Checkbox.
*   **Drag & Drop**:
    *   On `dragStart` of a selected item, set `e.dataTransfer` to carry a special `"bulk-move"` flag and the list of IDs (JSON string?).
    *   Or, just rely on local state if the drop target is in the sidebar (which is a separate component).
    *   Actually, `Sidebar.tsx` handles drops?
    *   If `Sidebar.tsx` expects `promptId` or `collectionId` in dataTransfer.
    *   I need to check `Sidebar.tsx` drop handling. If it only handles single items, I need to update it to support bulk.

### `components/Sidebar.tsx`
*   Check `handleDrop` or `onDrop` implementation.
*   Ideally, support `application/json` with `{ type: 'bulk-prompts', ids: [...] }`.

## 3. Testing
*   Unit tests for `services/prompts` (mock prisma).
*   UI tests (Playwright) for selecting and verifying actions.
*   Manual test: Drag multiple items to sidebar.
