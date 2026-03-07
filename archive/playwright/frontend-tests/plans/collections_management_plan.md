# Collections Management Test Plan

Based on the `Epic_Collections_Management.md`, we will implement E2E tests using Playwright.

## File: `frontend-tests/collections_management.spec.ts`

### Scenario 1: Create a Collection
1. **Pre-requisite**: Log in as a User.
2. **Action**: Navigate to `Dashboard` -> Click "New Collection" (or use context menu/sidebar).
3. **Action**: Fill in title "Test Collection", description "A test description", and save.
4. **Assert**: The collection "Test Collection" should appear in the side navigation.

### Scenario 2: Create a Nested Collection
1. **Action**: Create another collection.
2. **Action**: Title it "Child Collection".
3. **Action**: Select "Test Collection" from the "Parent" dropdown.
4. **Assert**: It appears under "Test Collection" in the sidebar tree.

### Scenario 3: Collection Grid View & Prompt Count
1. **Action**: Create a new prompt assigned to "Test Collection".
2. **Action**: Navigate to "Test Collection" via the sidebar.
3. **Assert**: The grid view should display the PromptCard for the newly created prompt.

### Scenario 4: Edit a Collection (Context Menu)
1. **Action**: Hover over "Test Collection" in the sidebar and trigger the context menu `...`.
2. **Action**: Click "Edit".
3. **Action**: Update the title to "Test Collection Updated".
4. **Assert**: The sidebar reflects the new collection name.

### Scenario 5: Delete Collection
1. **Action**: Trigger context menu on "Test Collection Updated".
2. **Action**: Select Delete.
3. **Action**: Confirm Deletion (Delete everything).
4. **Assert**: The collection is no longer in the sidebar.
