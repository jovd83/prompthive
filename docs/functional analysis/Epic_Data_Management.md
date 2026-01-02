---
title: Epic_Data_Management
version: 2.1
last_updated: 2026-01-01
status: Live
---

# Epic: Data Management

## User Story: Import Data
**As a** User
**I want to** import prompts from various sources
**So that** I can consolidate my library.

### 1. Description
Users can import prompts from PromptHive backups, PromptCat exports, local folders, or by scraping web pages.

### 2. Technical Scope & Fields
*Derived from Code (components/ImportExportContent.tsx)*

*   **Unified Import**:
    *   **File**: .json (Required). Supports:
        *   Standard PromptHive Backup (Array of prompts or Object with `prompts` and `definedCollections`).
        *   PromptCat Export (Object with prompts/folders or Array).
        *   Auto-detection of format.
*   **Local Folder Import**:
    *   **Path**: Text Input (Absolute path).
    *   **Target Collection**: Dropdown (Root or Specific).
*   **AI Scraper**:
    *   **URL**: Text Input.
    *   **Results List**: Checkbox list of found prompts.
    *   **Import Action**: Imports selected items.

### 3. Acceptance Criteria (AC)
*   [ ] Verify Unified Import accepts valid PromptHive JSON (array).
*   [ ] Verify Unified Import accepts valid PromptCat JSON (object/array).
*   [ ] Verify Unified Import reconstructs the nested collection tree structure from `definedCollections`.
*   [ ] **AC8:** Verify imported prompts are correctly linked to their restored parent collections in the database and visible in the UI.
*   [ ] Verify proper progress bar is shown during import (identical UI to export).
*   [ ] Verify Scraper extracts prompts and allows selective import.
*   [ ] Verify Scraper copy button uses compact icon style to preserve layout space.

### 4. UI Wireframe Specification
**Image Source:** `assets/wireframes/data_import_export_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Dashboard Card Layout (Grid).
*   **Key Elements:**
    *   Card 1: AI Scraper Guide & Tool.
    *   Card 2: Export Button.
    *   Card 3: Unified Import Form (Supports all JSON formats).
    *   Card 4: Local Import (Green Style).

---

## User Story: Export Data
**As a** User
**I want to** export my prompts
**So that** I can backup my data or migrate.

### 1. Description
Users can download their entire library as a standard JSON file.

### 2. Technical Scope & Fields
*Derived from Code (components/ImportExportContent.tsx)*

*   **Action**: Button "Download JSON".
*   **Progress**: Visual progress bar showing export status.
*   **Result**: Success message with count (Translated).
*   **Endpoint**: `/api/export`.

### 3. Acceptance Criteria (AC)
*   [ ] Verify clicking button triggers a download of `prompts.json` (or similar).
*   [ ] **AC2:** The export file should be named `prompthive-backup-[DATE].json`.
*   [ ] **AC3:** The export can be filtered by selecting specific collections via a Tree View interface.
*   [ ] **AC4:** Granular selection options: "Select All", "Deselect All", and individual collection checkboxes.
*   [ ] **AC5:** Exported JSON must include `definedCollections` array describing the hierarchy (parent/child relationships).
*   [ ] **AC6:** UI must show a progress bar during the export process.
*   [ ] **AC7:** Upon completion, show a translated message: "Export complete: X prompts exported."

---

## User Story: Selective Export for PromptHive Zero
**As a** system user
**I want to** select which collections to include in the "PromptHive Zero" export using a hierarchical tree view
**So that** I can easily choose specific folders and their sub-folders to share or deploy to a lightweight instance.

**Acceptance Criteria:**
*   [ ] **AC1:** The export interface displays collections in a collapsible Tree View.
*   [ ] **AC2:** Each collection has a checkbox.
*   [ ] **AC3:** "Select All" and "Deselect All" buttons are available.
*   [ ] **AC4:** Export generates a JSON file containing only prompts from the selected collections.

## User Story: Export for PromptHive Zero
**As a** User
**I want to** export specific collections for PromptHive Zero
**So that** I can transfer a subset of my library to the lighter version.

### 1. Description
A specialized export function that produces a simplified JSON structure compatible with "PromptHive Zero". Users can select which collections to include.

### 2. Technical Scope & Fields
*   **UI**:
    *   List of all collections with checkboxes.
    *   "Select All" / "Deselect All" buttons.
    *   "Export" button.
*   **Output Format**:
    *   JSON with `version`, `collections`, and `prompts` arrays.
    *   Reduced field set (e.g., `shortPrompt`, `exampleOutput`).

### 3. Acceptance Criteria (AC)
*   [ ] Verify user can select/deselect collections.
*   [ ] Verify "Select All" toggles all checkboxes.
*   [ ] Verify generated JSON matches the specific PromptHive Zero schema.
*   [ ] Verify only prompts within selected collections are exported.


