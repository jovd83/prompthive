# Epic: Enhanced Prompt Card UI

## Description
Redesign the Prompt Card component to provide a comprehensive, vertical view of prompt details directly from the dashboard and search results. This improves discoverability and usability by surfacing key information and actions without needing to navigate to the detail page.

## User Stories

### Story 1: Vertical Card Layout
**As a** User
**I want to** see a taller, more detailed card for each prompt
**So that** I can assess the prompt's value at a glance.

**Acceptance Criteria:**
- The card layout is vertical.
- Elements are stacked logically (Header -> Image -> Description -> Code -> Meta).

### Story 2: Prompt Content Preview
**As a** User
**I want to** see the actual prompt text and be able to copy it from the card
**So that** I can use the prompt immediately.

**Acceptance Criteria:**
- A text area or code block displays the latest version of the prompt content.
- A "Copy" button is adjacent to the text area.
- Copying triggers a success indication (e.g., "Copied!").

### Story 3: Visual Thumbnails
**As a** User
**I want to** see a thumbnail of the result image on the card
**So that** I know what output the prompt generates.

**Acceptance Criteria:**
- If the latest version has a `resultImage` or `attachments` (of image type), display a thumbnail.
- If no image is present, hide the thumbnail section or show a placeholder (optional).

### Story 4: Detailed Metadata
**As a** User
**I want to** see modification time, stats, and tags clearly
**So that** I can quickly filter visually.

**Acceptance Criteria:**
- Display Modification Timestamp (e.g., "Updated 2h ago").
- Display View and Copy counts.
- Display Tags.
- Display Favorites button in the header.

## Technical Tasks
- [ ] Update `app/(dashboard)/page.tsx` data fetching to include `versions` (content, resultImage) and `updatedAt`.
- [ ] Update `services/favorites.ts` to ensuring `versions` are returned (already done, verify fields).
- [ ] Refactor `PromptCard.tsx` to match the new design requirements.
- [ ] Add Playwright tests for the new card interactions (Copy button).
