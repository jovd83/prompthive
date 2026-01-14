---
title: Epic_Search_And_Discovery
version: 2.1
last_updated: 2025-12-23
status: Live
---

# Epic: Search & Discovery

## User Story: Advanced Search
**As a** User
**I want to** filter prompts by specific criteria
**So that** I can find exactly what I need.

### 1. Description
Users can search for prompts using keywords and advanced filters like Tags and Creator.

### 2. Technical Scope & Fields
*Derived from Code (components/AdvancedSearch.tsx)*

*   **Search Bar**: Text Input (Keywords).
*   **Filter Toggle**: Button (Filter Icon).
*   **Filters Panel**:
    *   **Tags**: Text Input (Comma-separated). Tags display with their assigned color if enabled.
    *   **Creator**: Text Input (Username/Email).
    *   **Technical ID**: System searches automatically for ID patterns (e.g. UNAS-1).

### 3. Acceptance Criteria (AC)
*   [ ] Verify that pressing Enter triggers the search.
*   [ ] Verify that opening the filter panel reveals advanced options.
*   [ ] Verify "Clear" resets all fields.
*   [ ] Verify searching by Technical ID (e.g. UNAS-123) retrieves the specific prompt.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/search_advanced.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Search Component with Dropdown Panel.
*   **Key Elements:** Search Input, Filter Button, Expanded Panel with Tag/Creator inputs.

---

## User Story: Command Palette
**As a** Power User
**I want to** navigate via keyboard
**So that** I can work faster.

### 1. Description
A global command palette (`Ctrl+K`) allows users to navigate to pages, perform quick actions, and toggle the theme.

### 2. Technical Scope & Fields
*Derived from Code (components/CommandPalette.tsx)*

*   **Trigger**: `Cmd+K` / `Ctrl+K`.
*   **Actions**:
    *   **Navigation**: Home, Settings, Help.
    *   **Creation**: Create New Prompt, Create Collection.
    *   **Preferences**: Toggle Theme.

### 3. Acceptance Criteria (AC)
*   [ ] Verify `Ctrl+K` opens the palette.
*   [ ] Verify searching for "Dark" shows the "Toggle Theme" option.
*   [ ] Verify clicking an action performs the expected navigation.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/command_palette_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Centered Modal Overlay.
*   **Key Elements:** Search Field, List of Actions with Icons and Shortcuts.

