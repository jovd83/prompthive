# FA-010: Prompting Tip of the Day

## 1. Introduction
The "Prompting Tip of the Day" feature aims to educate users on better prompting techniques directly within their workflow. A tip will be displayed on the dashboard, which users can expand for more details or disable entirely via settings.

## 2. User Stories
### US-001: View Tip on Dashboard
**As a** user,
**I want to** see a "Prompting Tip of the Day" on my dashboard,
**So that** I can learn new prompting strategies regularly.

**Acceptance Criteria:**
- [ ] The tip appears at the top of the dashboard, above the main page title (e.g., "Dashboard" or "Search Results").
- [ ] By default, only the Title and Short description are visible (Collapsed state).
- [ ] The tip section has a clear visual distinction (e.g., border, icon).

### US-002: Expand/Collapse Tip
**As a** user,
**I want to** expand the tip to see more details,
**So that** I can read the full explanation and access resources without cluttering my view by default.

**Acceptance Criteria:**
- [ ] Clicking the tip container or an "Expand" button reveals the Long description.
- [ ] When expanded, a "Learn More" link (Resource URL) is displayed if available.
- [ ] The user can collapse the tip back to its original state.

### US-003: randomize Tip
**As a** user,
**I want to** see a different tip each day (or on refresh/randomly),
**So that** I am exposed to the full variety of tips over time.

**Acceptance Criteria:**
- [ ] A tip is selected from the `prompt_tips.json` library.
- [ ] (MVP) Random selection on page load is acceptable, or a deterministic hash based on date. *Decision: Random on load for MVP simplicity and engagement.*

### US-004: Enable/Disable Tips
**As a** user,
**I want to** be able to turn off the "Tip of the Day" feature,
**So that** I can customize my dashboard experience and remove distractions if I'm already an expert.

**Acceptance Criteria:**
- [ ] A new setting "Show Prompting Tips" is available in the User Settings.
- [ ] Default value is `Enabled`.
- [ ] When `Disabled`, the Tip component is completely removed from the Dashboard.

## 3. Data Model
### Settings Update
- Add `showPrompterTips` (boolean) to the User Settings.

## 4. Design Constraints
- Must be responsive (mobile/desktop).
- Must match existing design system (Tailwind classes).
- Must utilize existing translation infrastructure (`locales`).
