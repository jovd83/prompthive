# Epic: Responsive Design Overhaul

## 1. Description
The goal of this epic is to ensure MyPromptHive provides a seamless and optimized user experience across all device sizes, specifically targeting mobile phones (e.g., iPhone) and tablets (e.g., iPad). Currently, the application is optimized for desktop, leading to layout breaks and usability issues on smaller screens.

## 2. User Stories

### US-001: Mobile Navigation
**As a** mobile user,
**I want** a collapsible navigation menu (hamburger menu),
**So that** I can access navigation links without the sidebar taking up the entire screen.

**Acceptance Criteria:**
- [ ] Sidebar is hidden by default on viewports width < 768px.
- [ ] A "Hamburger" menu icon is visible in the top header on mobile.
- [ ] Clicking the hamburger icon opens the sidebar as an overlay/drawer.
- [ ] Clicking outside the sidebar or on a link closes the drawer.
- [ ] The "Close" (X) button is present in the mobile drawer to dismiss it.

### US-002: Dashboard Responsive Layout
**As a** user on a small device,
**I want** the prompt cards to display in a single column,
**So that** the content is readable and not squashed.

**Acceptance Criteria:**
- [ ] Dashboard grid displays 1 column on screens < 640px.
- [ ] Dashboard grid displays 2 columns on screens >= 640px and < 1024px.
- [ ] Dashboard grid displays 3 or 4 columns on screens >= 1024px (unchanged).
- [ ] Search and Sort controls stack vertically on mobile.

### US-003: Prompt Detail Readability
**As a** mobile user,
**I want** the prompt detail view to reflow content,
**So that** I don't have to scroll horizontally to read text or see buttons.

**Acceptance Criteria:**
- [ ] Header actions (Edit, Delete, Favorite) wrap or scroll horizontally if they exceed screen width.
- [ ] Main content area and sidebar info (Variables, History) stack vertically.
- [ ] Tags flow naturally without breaking layout.
- [ ] Breadcrumbs are truncated or wrapped appropriately.

## 3. Technical Notes
- Use Tailwind CSS breakpoints (`md:`, `lg:`) to control layout changes.
- Implement a `MobileHeader` component for the top navigation bar on mobile.
- Ensure `Sidebar` state implies "Overlay" mode when on mobile.
