
---

## User Story: Import Prompts
**As a** User
**I want to** import prompts from a JSON file
**So that** I can restore backups or migrate data.

### 1. Description
Users can upload a JSON file containing prompts (standard or legacy format). The system parses it, creates collections if needed (V2), and imports prompts.

### 2. Technical Scope & Fields
*   **Input**: JSON File.
*   **Actions**:
    *   **Unified Import**: Handles single, array, and V2 structure.
    *   **Batch Processing**: Client-side batching invokes server action.

### 3. Acceptance Criteria (AC)
*   [ ] Verify valid JSON is parsed correctly.
*   [ ] Verify collections are created/restored if defined in V2.
*   [x] Verify that after import completes, the Sidebar Collections menu automatically refreshes to show new items.
