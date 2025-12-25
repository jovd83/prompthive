# Epic: Favorites Feature

## Description
Allow users to mark prompts as "Favorites" so they can easily access their most used or preferred prompts.

## User Stories

### Story 1: Favorite a Prompt
**As a** User
**I want to** click a favorite button on a prompt card or detail page
**So that** I can add it to my list of favorite prompts.

**Acceptance Criteria:**
- A "heart" icon is visible on the Prompt Card (card view).
- A "heart" icon is visible on the Prompt Detail page.
- Clicking the icon toggles the favorite status.
- The icon state reflects whether the prompt is favorited (e.g., filled vs. outline).
- This state is persisted per user.

### Story 2: View Favorites on Dashboard
**As a** User
**I want to** see my favorite prompts at the top of the dashboard
**So that** I can quickly access them.

**Acceptance Criteria:**
- The first row of the dashboard displays favorited prompts.
- If no favorites exist, this section is hidden or shows a placeholder.
- Limited to a certain number (e.g., top 4-6).

### Story 3: Favorites List Page
**As a** User
**I want to** access a dedicated page or filter for all my favorite prompts
**So that** I can see everything I've saved.

**Acceptance Criteria:**
- A menu item "Favorites" is added to the sidebar/navigation.
- Clicking it shows a list of all favorited prompts.

## Technical Tasks
- [ ] Update Database Schema (Prisma)
- [ ] Create Server Actions for toggling favorites
- [ ] Update `PromptCard` component
- [ ] Update `PromptDetail` page
- [ ] Update `Dashboard` page
- [ ] Update `Sidebar` navigation
- [ ] Add Playwright tests
