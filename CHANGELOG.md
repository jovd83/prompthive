# Changelog

## v2.3.2 (Unreleased)
### Added

### Changed

### Fixed

### Removed

## v2.3.1 (2026-01-02)
**Improvements:**
*   **Import Progress Bar**: Added a progress bar for JSON imports, processing files in batches to prevent the UI from freezing during large uploads.
*   **Bulk Actions Select All**: Added "Select All" and "Deselect All" buttons to the bulk action header in Collections, allowing users to quickly manage large numbers of prompts.
*    **Export UI**: Renamed generic JSON export button to "Export for PromptHive Zero" and ensured full internationalization support for the export section across all languages.

**Fixes:**
*   **JSON Import**: Fixed a crash when importing JSON files with missing commas (e.g. `} {`). The importer now attempts to automatically repair the JSON or displays a friendly error message in the UI instead of crashing the application.
*   **BOM Handling**: Improved handling of files with Byte Order Mark (BOM) characters.
*   **Hydration Error**: Fixed a React hydration mismatch error related to relative time display (e.g., "Updated 3 mins ago") in prompt cards.
*   **Copy Button**: Fixed an issue where the "Copy" button for the AI System Prompt in the Help section was non-functional in non-secure contexts (HTTP). Implemented a robust fallback mechanism.
*   **Import Linking**: Fixed a critical bug where imported prompts were not correctly linked to their nested collections if the ID mapping required a fallback to name-based lookup. This ensures prompts now correctly appear in deep hierarchies (Level 3+) after import.

### Added
* **Export Collections Tree**: Replaced flat list selection with a hierarchical **Tree View** for both standard and Zero exports, enabling granular selection of nested collections and their children.
* **Export for PromptHive Zero** allowing export of specific collections in a lightweight JSON format.
* **Locking Prompts**: Creators can now lock their prompts to prevent accidental edits or modification by other users. Locked prompts show a padlock icon and disable edit features.


## v2.3.0 (2025-12-29)

**New Features:**
*   **Collection Tree Visibility**: You can now hide specific collections (and their sub-collections) from the sidebar and main views via Settings, similar to User Visibility.
*   **Hierarchical Collection View**: Replaced the flat grid view with a proper Tree View in the Collections page for better navigation of deep hierarchies.
*   **Sorting Options**: Added ability to sort collections by Name (A-Z/Z-A), Date (Newest/Oldest), and Count (Most Items) in the main list.

**Improvements & Fixes:**
*   **Deployment**: Adjusted build process to use `npm install` for broader compatibility across platforms, preventing lockfile issues during Docker builds.
*   **Performance**: Optimized `CollectionTree` component for rendering large hierarchies.
*   **Localization**: Fully translated new settings and help documentation into Dutch, French, Spanish, Italian, German, and Swedish.
*   **UI Polish**: Added icons to Save buttons and improved visual feedback processing states.
