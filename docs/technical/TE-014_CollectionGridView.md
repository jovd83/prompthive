# TE-014: Collection Grid View

| Metadata | Details |
| :--- | :--- |
| **Feature** | Collection Grid View |
| **Epic** | Epic_Collections_Management |
| **Date** | 2025-12-23 |
| **Author** | Antigravity |

## Overview
The Collection Grid View provides a visual browsing experience for collections. When a user navigates to a collection without selecting a specific prompt, the application displays a grid of `PromptCard` components representing all prompts in that collection.

## Implementation Details
1.  **Data Fetching**:
    -   Modified `prisma.prompt.findMany` in `app/(dashboard)/collections/[id]/page.tsx` to include `content`, `resultImage`, and `attachments` in the `versions` relation.
    -   Added `favoritedBy` relation filtered by current user to inject `isFavorited` boolean property into each prompt.
    -   This ensures `PromptCard` has sufficient data to display thumbnails, previews, and correct favorite status.

2.  **UI Component**:
    -   Updated `active `CollectionSplitView.tsx` to check if `selectedPrompt` is null.
    -   If `collection.prompts` has items, it renders a responsive grid (using `PromptCard`).
    -   Reuses the same `PromptCard` component used in the Dashboard for consistency.

3.  **Responsiveness**:
    -   Grid adapts from `grid-cols-1` to `xl:grid-cols-4` depending on available width in the detail pane.

## Dependencies
-   `components/PromptCard.tsx`
-   `components/CollectionSplitView.tsx`

## Testing
-   **Unit Tests**: `components/CollectionSplitView.test.tsx` verified grid rendering logic.
-   **E2E Tests**: `frontend-tests/collection-grid.spec.ts` verifies navigation, visibility, and interaction.
