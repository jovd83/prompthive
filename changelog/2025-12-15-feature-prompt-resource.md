### Feature: Prompt Resource Link

#### 📘 Epics / User Stories / Acceptance Criteria
*   Updated `docs/functional analysis/Epic_Prompt_Management.md`.
*   Added **User Story: Prompt Resource Link**:
    *   **As a** User I want to add a resource link (URL) to my prompt.
    *   **Acceptance**: Input exists in forms, saved to `resource` field, displayed on Detail page as clickable link.

#### 🎨 Updated Wireframes (`docs/wireframes/`)
*   No visual wireframes required updates.
*   Textual description of UI changes included in Epic.

#### 🧠 Technical Documentation & Diagrams
*   **Data Models**: Updated `docs/diagrams/Data_Models.md` to include `resource` field in `Prompt` model.
*   **Schema**:
    ```prisma
    model Prompt {
      // ...
      resource String? // External URL or reference
    }
    ```

#### 💻 Code Implementation
Added `resource` field support across the full stack:

<details>
<summary>Database & Validation</summary>

*   **`prisma/schema.prisma`**: Added `resource` field.
*   **`lib/validations.ts`**: Added `resource` to Zod schemas.
</details>

<details>
<summary>Backend Logic</summary>

*   **`actions/prompts.ts`**: Updated `createPrompt` and `createVersion` to extract `resource` from FormData.
*   **`services/prompts.ts`**: Updated `createPromptService` and `createVersionService` to persist `resource` to database.
</details>

<details>
<summary>User Interface</summary>

*   **`components/CreatePromptForm.tsx`**: Added "Source (Optional)" collapsible section at the bottom.
*   **`components/EditPromptForm.tsx`**: Added "Source (Optional)" collapsible section at the bottom.
*   **`components/PromptDetail.tsx`**: Added "Source" card at the bottom of the main content column. Implemented conditional rendering (Link vs Text).
</details>

#### ✅ Unit Tests & Coverage
*   Coverage remains stable (modification to existing covered functions).
*   Logic is covered by Integration/E2E tests.

#### 🌐 Playwright Tests (`frontend-tests/`)
*   Created `frontend-tests/prompt-resource.spec.ts`.
*   **Test Case**: `should add, view, and edit a resource link on a prompt`.
    *   Creates a prompt with a resource URL.
    *   Verifies the presence of the link on the Detail page.
    *   Edits the prompt to update the URL.
    *   Verifies the update is reflected.

**Note**: Test execution requires a full server restart to pick up the Prisma Schema changes (`resource` column).

#### 📄 Manual/Help Pages
*   Feature is self-explanatory via UI labels ("Resource / URL (Optional)").

#### 📘 README.md Changes
*   Added "**Resource Linking**" to the Key Features list.
*   Fixed documentation links.

#### AI reference
*   `feature_id: prompt_resource_link_v1`
