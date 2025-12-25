---
title: Epic_Data_Management
version: 2.1
last_updated: 2025-12-23
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
        *   Standard PromptHive Backup (Array of prompts).
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
*   **Endpoint**: `/api/export`.

### 3. Acceptance Criteria (AC)
*   [ ] Verify clicking button triggers a download of `prompts.json` (or similar).

