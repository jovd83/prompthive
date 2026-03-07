# Search & Discovery Test Plan

Based on the `Epic_Search_And_Discovery.md`, we will implement E2E tests using Playwright.

## File: `frontend-tests/search_and_discovery.spec.ts`

### Scenario 1: Advanced Search
1. **Pre-requisite**: Log in as a User.
2. **Action**: On the Dashboard, locate the Search input field.
3. **Action**: Type a keyword (e.g. "Test") and press `Enter`.
4. **Assert**: The URL contains `?q=Test` or equivalent.
5. **Action**: Click the `Filter` icon to open the advanced search panel.
6. **Action**: Enter tags "coding" and creator "test@example.com". Click `Apply`.
7. **Assert**: The URL is updated with `&tags=coding&creator=test%40example.com`.
8. **Action**: Click the `Clear` button in the advanced search panel.
9. **Assert**: The URL is reset without the query parameters, and fields are empty.

### Scenario 2: Command Palette Command Navigation
1. **Pre-requisite**: Log in as a User.
2. **Action**: Press `Control+K` (or `Meta+K` on Mac).
3. **Assert**: The Command Palette modal becomes visible.
4. **Action**: Type "Theme" into the search field of the Command Palette.
5. **Assert**: The "Toggle Theme" option becomes available and visible.
6. **Action**: Click the "Toggle Theme" option.
7. **Assert**: The `<html/>` element's `class` attribute updates to toggle 'dark' mode.
8. **Action**: Press `Control+K` again, search for "New Prompt", and select it.
9. **Assert**: The URL updates to `/prompts/new`.
