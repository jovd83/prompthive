# Epic: Technical IDs for Prompts/Skills

## Goal
Implement a readable, unique, and persistent technical ID for each Prompt/Skill to facilitate searching, reference, and future API usage. The ID should be human-readable and based on the context (Collection) where the prompt resides.

## User Stories

### Story 1: Automatic ID Generation
**As a** system,
**I want to** automatically assign a technical ID to every prompt upon creation or assignment to a collection,
**So that** each prompt has a unique, human-readable identifier (e.g., `VIBE-123`).

**Acceptance Criteria:**
- Format: `[PREFIX]-[NUMBER]`.
- Prefix: 3-4 letters derived from the Collection name (e.g., "Vibe Coding" -> "VIBE", "Sales" -> "SALE").
- Number: Sequential integer starting from 1, unique per prefix.
- IDs are unique within the system.
- If a collection name suggests a duplicate prefix (e.g., "Vibe Coding" and "Vibration"), the system handles it (e.g., logic to ensure uniqueness or shared sequence). *Refinement: Requirement says "system should ensure that their are no doubles".* Implementation will use a unique constraint on the TechnicalIdSequence prefix or shared sequence if collision.
- **UI Requirement (Details Page)**: The Technical ID must be displayed on the Prompt Details page, under the title, on the same line as other metadata (tags, creator, etc.).
- **UI Requirement (Dashboard)**: The Technical ID must **NOT** be displayed on the Prompt Card in dashboard/list views to save space.

### Story 2: ID Regeneration on Move
**As a** user,
**I want** the technical ID to update when I move a prompt to a different collection,
**So that** the ID always reflects the current context.

**Acceptance Criteria:**
- When a prompt is moved from Collection A to Collection B, the old ID (e.g., `COLLA-1`) is replaced by a new ID based on Collection B (e.g., `COLLB-5`).
- The old ID is *not* reused immediately (sequences only increment).

### Story 3: Import/Export Handling
**As a** developer,
**I want** technical IDs to be excluded from exports and regenerated on imports,
**So that** IDs remain unique to the environment and don't cause conflicts when sharing content.

**Acceptance Criteria:**
- Exported JSON/Data does *not* contain `technicalId`.
- Importing a prompt generates a new `technicalId` based on the target collection in the receiving environment.

### Story 4: Search by ID
**As a** user,
**I want to** search for a prompt using its technical ID,
**So that** I can quickly find specific items by their reference code.

**Acceptance Criteria:**
- Typing `VIBE-123` in the search bar retrieves the specific prompt.

### Story 5: Direct URL Access
**As a** user,
**I want to** access a prompt directly via its technical ID in the URL (e.g., `/prompts/VIBE-123`),
**So that** I can easily share and navigate to prompts using their human-readable reference.

**Acceptance Criteria:**
- Navigating to `/prompts/[TECHNICAL-ID]` loads the correct prompt details page.
- Works identical to navigating via the system UUID (`/prompts/[UUID]`).

## Technical Constraints
- System must track the last used number for each prefix.
- Rollback support: The AI/System should be able to identify these IDs for potential rollback (though the main requirement is just "Technical ID").
