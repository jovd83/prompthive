# TE-011: Collection Sorting Architecture

## Overview
This document describes the implementation of sorting functionality within Collection views. The goal is to align the behavior with the main dashboard sorting.

## Architecture

### Data Flow
1.  **User Action**: User clicks a sort button in `SortControls`.
2.  **Navigation**: `SortControls` updates the URL query parameters (`?sort=...&order=...`) via `router.push`.
3.  **Server Component**: `CollectionDetailPage` (`app/(dashboard)/collections/[id]/page.tsx`) receives the new `searchParams`.
4.  **Data Fetching**: The `orderBy` clause in the Prisma query is dynamically constructed based on the params.
5.  **Rendering**: The page re-renders with the sorted `prompts` passed to `CollectionSplitView`.

### Components
*   **SortControls**: Reusable Client Component. Handles UI state and URL updates.
*   **CollectionDetailPage**: Server Component. Orchestrates data fetching.
*   **CollectionSplitView**: Client Component. Displays the list (now containing `SortControls`).

### Query Strategy
The sorting logic maps URL parameters to Prisma `orderBy` inputs:

| Param `sort` | Param `order` | Prisma `orderBy` |
| :--- | :--- | :--- |
| `date` | `desc` (default) | `{ createdAt: 'desc' }` |
| `date` | `asc` | `{ createdAt: 'asc' }` |
| `alpha` | `asc` | `{ title: 'asc' }` |
| `alpha` | `desc` | `{ title: 'desc' }` |
| `usage` | * | Not yet implemented for collections (defaults to date) |

### Test Strategy
*   **Unit Tests**: Not applicable for Page Server Component logic directly, but E2E tests will cover the integration.
*   **E2E Tests**: Verify that changing sort order updates the visible list order.
