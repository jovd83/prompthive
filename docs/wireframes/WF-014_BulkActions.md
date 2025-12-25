# Wireframe: Bulk Actions (Selection Mode)

## Overview
This wireframe describes the "Selection Mode" within the Collection View.

### 1. Default State (Collection List)
*   **Header**: "Prompts", "Sort Control (...)".
*   **List Item**: Prompt Title.
*   **Menu**: "..." next to Collection Title (top).
    *   **Option**: "Change multiple..." (New)

### 2. Selection Mode (Active)
Triggered by clicking "Change multiple..." in the collection menu.

#### Header Changes
*   **Sort Control**: Hidden or Disabled.
*   **Action Bar**: Replaces standard header or appears above text.
    *   **Text**: "X selected"
    *   **Button**: "Add Tags" (Icon: Tag)
    *   **Button**: "Done" / "Cancel" (Icon: X or Check)

#### List Item Changes
*   **Checkbox**: Appears to the left of the prompt title.
*   **Interaction**: Clicking anywhere on the item (or checkbox) toggles selection.
*   **Drag Handle**: Items are draggable.
    *   **Logic**: Dragging *one* selected item drags *all* selected items.

### 3. Tag Selection Modal
Triggered by "Add Tags" button.
*   **Modal**: Standard TagSelector component in a dialog.
*   **Action**: "Apply Tags" button.

### 4. Drag & Drop Interaction
*   **Source**: Selection Group.
*   **Target**: Sidebar Collection Item.
*   **Feedback**: "Move X items to [Collection Name]".
