# TE-012: Collapsible Collections and Tags Implementation

## 1. Component Overview
**Component:** `Sidebar.tsx`

The `Sidebar` component is updated to manage local state for the visibility of "Collections" and "Tags" sections.

## 2. State Management
Two new state variables are introduced:
- `isCollectionsOpen` (boolean, default: `true`)
- `isTagsOpen` (boolean, default: `true`)

## 3. UI Changes
### Collections Header
- Wrapped in a flex container to allow clicking.
- Added a toggle button with `ChevronRight` (rotated if expanded, or switched to `ChevronDown`).
- The collection tree rendering is conditional based on `isCollectionsOpen`.

### Tags Header
- Similar treatment as Collections.
- The tags list rendering is conditional based on `isTagsOpen`.

## 4. Accessibility
- Buttons include `aria-label` or `title` for screen readers.
- Keyboard navigation remains intact.

## 5. Persistence
Current implementation uses local component state. Persistence (e.g., via `localStorage`) is not currently implemented but can be added in future iterations if requested.
