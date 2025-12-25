# FA-009: User Visibility Settings

## 1. Overview
This feature allows users to customize their feed and prompt visibility by selecting which other users' content they wish to see. By default, content from all users is visible. Users can "hide" specific users (opt-out), effectively removing their prompts from the dashboard and search results.

## 2. User Stories

### US-01: Visibility Settings Interface
**As an** authenticated user
**I want to** see a list of all users in my Settings page
**So that** I can choose who I want to see content from.

**Acceptance Criteria:**
*   A new section "User Visibility" is added to the Settings page.
*   A list of all registered users is displayed.
*   Each user (except myself) has a checkbox.
*   There are "Check All" and "Uncheck All" buttons.
*   My own user entry is displayed but the checkbox is checked and disabled (I cannot hide myself).
*   Search filter for the user list (optional but recommended for UX if list is long). // *Decision: Keep simple for MVP: just list.*

### US-02: Saving Preferences
**As an** authenticated user
**I want to** save my visibility preferences
**So that** they persist across sessions.

**Acceptance Criteria:**
*   Clicking "Save" on the Settings page updates the database.
*   The system stores the list of "hidden" users (unchecked ones).
*   By default (for new settings), everyone is "visible" (empty hidden list).

### US-03: Filtering Prompts
**As an** authenticated user
**I want to** only see prompts from users I haven't hidden
**So that** my view is relevant to me.

**Acceptance Criteria:**
*   The Dashboard prompt feed excludes prompts from hidden users.
*   Search results exclude prompts from hidden users.
*   Collection views exclude prompts from hidden users.
*   Hidden users' content is filtered out at the server level (or service level) before reaching the UI.

## 3. Business Rules
*   **Opt-Out Model**: Users are visible by default. When a new user registers, they invoke "true" for visibility for everyone else (since no one has hidden specifically them yet).
*   **Self-Visibility**: A user must always see their own content.

## 4. Risks & Assumptions
*   **Performance**: If the user base grows large, fetching all users in the settings page might be slow. *Mitigation:* basic pagination or virtualization if needed, keeping it simple for now as it's an internal tool likely.
*   **SQLite Limitation**: Complex filtering on exclusions might need careful query construction.
