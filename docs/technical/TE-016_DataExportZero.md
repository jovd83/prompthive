# TE-016 Export for MyPromptHive Zero

## 1. Overview
This feature allows users to export a subset of their prompt library specifically formatted for "MyPromptHive Zero". Users can select which collections to include in the export.

## 2. Architecture

### Frontend
- **Component**: `components/ImportExportContent.tsx`
- **UI**: A new card containing:
    - A multi-select list of collections (using checkboxes).
    - "Select All" / "Deselect All" logic.
    - An "Export" button.
- **Logic**:
    - The component receives the full list of collections as a prop.
    - It maintains a state of `selectedCollectionIds`.
    - On export, it makes a POST request to `/api/export-zero` with the selected IDs.
    - The response is a JSON blob which is then downloaded.

### Backend
- **Endpoint**: `/api/export-zero` (POST)
- **Input**: `{ collectionIds: string[] }`
- **Output**: JSON file (Download attachment) containing:
    ```json
    {
      "version": 1,
      "collections": [...],
      "prompts": [...]
    }
    ```
- **Logic**:
    1. Validate authentication.
    2. Fetch selected collections by ID (including children if we were doing recursive, but for now simple selection).
    3. Fetch prompts that have a relation to any of the selected collections.
    4. Transform data to the lightweight "Zero" format.
       - `prompts` should only include fields: `id`, `title`, `description`, `body`, `shortPrompt`, `exampleOutput`, `expectedResult`, `tags`, `collectionId`, timestamps.
       - Note: `body` maps from the latest version's content.

## 3. Data Model
No schema changes. We utilize existing `Box` (Collection) and `Prompt` models.

## 4. Security
- Only authenticated users can export.
- Users can only export content they own (enforced by `createdById` check).
