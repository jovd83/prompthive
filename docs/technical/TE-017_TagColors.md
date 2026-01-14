# TE-017 Technical Specification: Tag Colors

## 1. Context
Users desire visual distinction for tags to help organize and quickly identify prompts. This feature introduces a color property to Tags and a user preference to toggle this visual richness on or off.

## 2. Architecture Changes

### Data Model
*   **Tag Entity**:
    *   New Field: `color` (String, nullable). Stores a Hex code (e.g. `#FF5733`).
*   **Settings Entity**:
    *   New Field: `tagColorsEnabled` (Boolean, default `true`).

### Frontend Components
*   **TagSelector**:
    *   Updated to accept a `color` property in the Tag object.
    *   Conditionally renders styles based on the global setting (passed via prop or retrieved from store).
*   **GeneralSettings**:
    *   Adds a toggle for `tagColorsEnabled`.

## 3. Data Flow
1.  **Creation**: When a new tag is created via `createTag` action, a random color is selected from a predefined palette and saved to the DB.
2.  **Display**:
    *   Components fetch Tags (which now include colors).
    *   Components check `Settings.tagColorsEnabled`.
    *   If enabled, apply inline styles or dynamic classes using the stored color.
    *   If disabled, use default Tailwind classes.

## 4. Migration Strategy
*   Schema migration to add columns.
*   (Optional) Backfill script to assign colors to existing tags, or handle `null` color as "assign on first load" or "render default". *Decision: `createTag` handles new ones. Existing ones will be `null` and fallback to a deterministic hash color or default.*
