# Change Request: Progress Bar for Collection Deletion

## 1. Impact Analysis

### a. Impacted Assets
**Epics & User Stories:**
- `docs/functional analysis/Epic_Collections_Management.md`:
    - **User Story: Collection Context Menus**: "Delete" content needs to specify progress feedback for long-running operations.

**Technical Components:**
- **Frontend**: `components/collection-view/CollectionSidebar.tsx` (modifying the delete handler to support batching/progress).
- **Backend (Actions)**: 
    - `actions/collections.ts` (needs new action `getCollectionDescendantsAction`).
    - `actions/prompts.ts` (needs new action `bulkDeletePrompts`).
- **Backend (Services)**:
    - `services/collections.ts` (expose descendant retrieval).
    - `services/prompts.ts` (expose bulk delete logic).

**Tests:**
- **Unit Tests**: `tests/collections.test.ts` (or similar) needs to cover the new descendant retrieval.
- **E2E Tests**: `frontend-tests/collections.spec.ts` (if exists) might handle deletion, but visual progress bar changes might not require E2E update unless we test necessary presence of the bar.

### b. Valid/Obsolete/Changed
- **Valid**: The concept of recursive deletion remains valid.
- **Changed**: The *execution method* changes from a single "black box" server call to a "client-orchestrated" batch process to allow progress visibility.
- **Obsolete**: The reliance on `deleteCollection(..., deletePrompts=true)` doing *everything* in one go (for large collections) is being replaced by the batched approach for the *prompts* deletion phase. The final empty collection cleanup will still be atomic.

## 2. Rationale
The current implementation locks the UI or provides no feedback during the deletion of large collections (containing thousands of prompts/assets), leading to user frustration and potential timeouts. A progress bar provides necessary feedback. Client-side batching is chosen over server-side streaming to fit within the current Next.js Action architecture without major infrastructure changes (e.g. adding WebSockets/Redis).
