# Responsive Design Wireframes

## 1. Navigation Structure

### Desktop (> 768px)
*   **Sidebar**: Fixed to the left, always visible (collapsible).
*   **Main Content**: To the right of the sidebar, fluid width.

### Mobile (< 768px)
*   **Header (New)**: Fixed top bar containing:
    *   [Hamburger Icon] (Left)
    *   [Logo/Title: MyPromptHive] (Center/Left)
*   **Sidebar**: Hidden by default.
    *   **State: Open**: Slides in from the left (Overlay), covering 80% of the screen. Dark backdrop overlay on content.
*   **Main Content**: Full width below the header.

## 2. Dashboard Layout

### Desktop
*   **Grid**: 3 or 4 columns of cards.
*   **Toolbar**: Search bar (Left) and Sort Filter (Right) aligned horizontally.

### Mobile
*   **Grid**: 1 column (vertical stack).
*   **Toolbar**:
    *   Search Bar (Full Width)
    *   [Vertical Space]
    *   Sort Filter (Full Width or wrapping)

## 3. Prompt Detail Layout

### Desktop
*   **Two Column split**:
    *   Left (2/3): Description, Content, Output.
    *   Right (1/3): Variables, History, Metadata.

### Mobile
*   **Single Column**:
    *   Header (Title + wrapped actions)
    *   Description
    *   Content
    *   Output
    *   Variables (Stacked below content)
    *   History (Stacked below variables)
