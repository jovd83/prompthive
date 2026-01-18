# Changelog

## v2.3.5 (Unreleased)
### Fixed
*   **Localization**: Fixed missing Command Palette help translation keys in the Spanish (es) locale file.
*   **Command Palette**: Fixed a critical bug where the Command Palette failed to display translated text, showing only translation keys. The component now correctly accesses the language context.
*   **Collection Deletion**: Fixed an issue where "Delete everything" on a collection moved child collections to the root instead of deleting them recursively. The action now correctly removes all nested content.

## v2.3.4 (2026-01-14)
### Changed
*   **Infrastructure**: Updated build scripts and acceptance environment configuration.
*   **Tests**: Updated frontend tests.

## v2.3.3 (2026-01-13)
### Added
*   **Tag Colors**: Added visual distinction for tags with unique colors. Users can enable/disable this feature in General Settings.
*   **Guest Account**: Added a new `GUEST` role with read-only access.
    *   Admins can create Guest users via the new Admin Dashboard (`/admin/users`).
    *   Guest users can view Prompts and Collections but cannot Edit, Delete, Link, or Favorite items.
    *   Restricted "New Prompt" and "Admin" navigation for Guests.
    *   **UI Restrictions**: Hidden 'Import/Export' and 'Preferences', disabled download and delete actions for Guest users.
*   **User Management**: Added ability for Admins to **Delete Users** via the Admin Settings page. **Content Preservation**: Prompts, Collections, and Workflows are reassigned to the Admin instead of being deleted.
*   **Tag Settings**: Added "Enable Tag Colors" preference to General Settings.
*   **Technical IDs**:
    *   Supports searching by Technical ID (e.g., `VIBE-123`) in the main dashboard.
    *   Direct URL access via `/prompts/[technicalId]`.
    *   **Fix**: Ensure Technical IDs are generated when importing JSON files.
    *   IDs are generated automatically based on the collection name.
    *   IDs are regenerating when moving prompts between collections or importing.
    *   Search now supports finding prompts by their Technical ID.
    *   Direct URL routing is supported (e.g. `/prompts/VIBE-1`).
*   **Linked Prompts**:
    *   **Relation**: Ability to link related prompts together (bidirectional).
    *   **UI**: "Related Prompts" section in prompt details with card view.
    *   **Export/Import**: Linked relationships are preserved during JSON export and restored upon import (matching by Technical ID).
*   **Workflow Visibility**:
    *   **Settings**: Added "Show Workflows" toggle in General Settings (Default: Hidden).
    *   **Sidebar**: Workflows section is now hidden by default to declutter the UI for users who don't need it.
    *   **Logic**: Conditionally renders sidebar links and routes based on user preference.
*   **Private Prompts**:
    *   **Feature**: Added ability for users to mark prompts as "Private", making them visible only to themselves.
    *   **Admin Control**: Feature can be toggled on/off globally by Administrators in General Settings.
    *   **UI**: Added visual "Private" badge to prompt details and a checkbox in the prompt editor.
    *   **Visibility Toggle**: Dedicated Eye/EyeOff toggle button for creators in the prompt detailed view (next to Favorite icon) to quickly switch between Public and Private status.

### Changed
*   **Settings Relocation**: Moved **Auto-backup** and **Danger Zone** (Restore/Reset) from the generic Settings page to the bottom of the **Import/Export** page (`/import-export`) to centralize data management operations.
*   **Improved**: Deleting a prompt from within a Collection no longer redirects to the Dashboard, but keeps you in the Collection.

### Fixed

*   **Prompt Locking**: Fixed an issue where the **Delete** button remained active even when a prompt was locked. It is now correctly disabled.
*   **Related Prompts UI**: Fixed the layout and styling of the "Related Prompts" section in the prompt detail view. It is now positioned as the last pane and uses consistent `PromptCard` styling matching the dashboard.
*   **Related Prompts Scroll**: Updated the "Related Prompts" section to use a single row layout with horizontal scrolling for better space utilization.
*   **Technical ID Display**: Fixed an issue where the Technical ID was missing from the prompt detail header. It is now displayed in a badge alongside the author and timestamp information.
*   **Linked Prompts Visibility**: Fixed bidirectional visibility for related prompts. Linking Prompt A to Prompt B now correctly ensures Prompt A appears in Prompt B's "Related Prompts" section.
*   **Tag Colors**: Fixed an issue where tag colors were not being displayed on the prompt detail page. They now correctly reflect the assigned color.
*   **Unlink Prompt**: Removed the confirmation dialog when unlinking prompts. The action is now immediate for a smoother user flow.
*   **Guest Permissions**: Fixed a security issue where Guest users could see and interact with the prompt delete button. It is now correctly disabled.
*   **Collection Drag & Drop**: Fixed a bug where dragging prompts into sidebar subcollections (nested items) was not possible. Added better drop zone detection and visual feedback for nested structures.
*   **Collection List View Drop**: Enabled dragging prompts into sub-collection folders directly from the main collection list view.
*   **Dashboard Search**: Fixed Dashboard Search to include Technical ID in search results.
*   **Guest Favorites**: Fixed an issue where Guest users could see and interact with the favorite button. It is now correctly disabled.
*   **Guest Interaction**: Fixed a bug where Guest users could drag prompt cards, which caused potential errors. Drag and drop is now disabled for guests.
*   **Search Prompts**: Fixed an issue where already linked prompts appeared in the "Link Prompt" search results. They are now filtered out.
*   **Tag Display**: Fixed tag overflow on prompt detail pages. Tags now display in a single line with a "View all" expansion option for cleaner layout.

### Removed

## v2.3.2 (2026-01-05)
### Added
*   **Export Collection**: Added "Export Collection" option to the specific collection menu (header '...' button), allowing users to export a collection tree as a JSON file.

### Changed
*   **Documentation**: Merged technical documentation (`SAD_Tech_stack.md` into `TECHNICAL_REFERENCE.md`).

### Fixed
*   **Documentation**: Fixed broken image paths in `TECHNICAL_REFERENCE.MD`.
*   **Dashboard Favorites**: Fixed a bug where the last favorite item could not be unfavorited from the dashboard due to state synchronization issues in the prompt card component.
*   **Prompt View**: Fixed a UI bug where the description of a variable was displayed twice in the prompt detail view.
*   **Prompt Edit**: Fixed an issue where the description field would get cleared when adding or removing tags during prompt editing.

### Removed

## v2.3.1 (2026-01-02)
### Added
*   **Import Progress Bar**: Added a progress bar for JSON imports, processing files in batches to prevent the UI from freezing during large uploads.
*   **Bulk Actions Select All**: Added "Select All" and "Deselect All" buttons to the bulk action header in Collections, allowing users to quickly manage large numbers of prompts.
*   **Export for PromptHive Zero**: allowing export of specific collections in a lightweight JSON format.
*   **Locking Prompts**: Creators can now lock their prompts to prevent accidental edits or modification by other users. Locked prompts show a padlock icon and disable edit features.


### Changed
*   **Export UI**: Renamed generic JSON export button to "Export for PromptHive Zero" and ensured full internationalization support for the export section across all languages.
*   **Export Collections Tree**: Replaced flat list selection with a hierarchical **Tree View** for both standard and Zero exports, enabling granular selection of nested collections and their children.

### Fixed
*   **JSON Import**: Fixed a crash when importing JSON files with missing commas (e.g. `} {`). The importer now attempts to automatically repair the JSON or displays a friendly error message in the UI instead of crashing the application.
*   **BOM Handling**: Improved handling of files with Byte Order Mark (BOM) characters.
*   **Hydration Error**: Fixed a React hydration mismatch error related to relative time display (e.g., "Updated 3 mins ago") in prompt cards.
*   **Copy Button**: Fixed an issue where the "Copy" button for the AI System Prompt in the Help section was non-functional in non-secure contexts (HTTP). Implemented a robust fallback mechanism.
*   **Import Linking**: Fixed a critical bug where imported prompts were not correctly linked to their nested collections if the ID mapping required a fallback to name-based lookup. This ensures prompts now correctly appear in deep hierarchies (Level 3+) after import.
*   **Prompt Deletion**: Resolved "Foreign Key Constraint" error when deleting Prompts. Associated Favorites and Workflow Steps are now properly cleaned up before deletion.
*   **Import Technical IDs**: Resolved issue where imported prompts (JSON) were missing Technical IDs (`technicalId`), preventing search and routing.

## v2.3.0 (2025-12-29)
### Added
*   **Collection Tree Visibility**: You can now hide specific collections (and their sub-collections) from the sidebar and main views via Settings, similar to User Visibility.
*   **Sorting Options**: Added ability to sort collections by Name (A-Z/Z-A), Date (Newest/Oldest), and Count (Most Items) in the main list.
*   **Localization**: Fully translated new settings and help documentation into Dutch, French, Spanish, Italian, German, and Swedish.

### Changed
*   **Hierarchical Collection View**: Replaced the flat grid view with a proper Tree View in the Collections page for better navigation of deep hierarchies.
*   **Performance**: Optimized `CollectionTree` component for rendering large hierarchies.
*   **UI Polish**: Added icons to Save buttons and improved visual feedback processing states.

### Fixed
*   **Deployment**: Adjusted build process to use `npm install` for broader compatibility across platforms, preventing lockfile issues during Docker builds.
