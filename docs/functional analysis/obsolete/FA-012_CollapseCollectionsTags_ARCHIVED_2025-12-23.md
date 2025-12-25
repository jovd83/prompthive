# FA-012: Collapse/Expand Collections and Tags Sections

## 1. Introduction
The sidebar contains "Collections" and "Tags" sections which can grow large. Users need the ability to collapse these sections independently to manage vertical space and focus on what's relevant to them.

## 2. User Stories
### US-001: Collapse Collections Section
**As a** user,
**I want to** collapse the "Collections" section in the sidebar,
**So that** I can hide the list of collections when I don't need them.

**Acceptance Criteria:**
- [ ] The "COLLECTIONS" header in the sidebar has a clickable toggle icon (chevron).
- [ ] Clicking the header or icon toggles the visibility of the collections list.
- [ ] Default state is **Expanded**.
- [ ] When collapsed, only the header remains visible.

### US-002: Collapse Tags Section
**As a** user,
**I want to** collapse the "Tags" section in the sidebar,
**So that** I can hide the list of tags when I don't need them.

**Acceptance Criteria:**
- [ ] The "TAGS" header in the sidebar has a clickable toggle icon (chevron).
- [ ] Clicking the header or icon toggles the visibility of the tags list.
- [ ] Default state is **Expanded**.
- [ ] When collapsed, only the header remains visible.

## 3. Design Constraints
- Must match existing design system.
- Chevron icons should indicate state (down for expanded, right for collapsed).
- Transitions should be smooth if possible (optional but good).
