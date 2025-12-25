# Epic: Prompts Management
**Entity:** `Prompts`

This epic covers the core functionality of creating, managing, viewing, and iterating on AI prompts. It is the central entity of the PromptHive application.

## User Stories

### 1. Create a New Prompt
**As a** User
**I want to** create a new prompt with detailed metadata (title, content, tags, collection)
**So that** I can save and organize my prompt engineering work for future use.

**UI/UX Description:**
- **Navigation:** Accessible via the "New Prompt" button in the Sidebar or top-right action buttons.
- **Interface:** 
    - A clean, two-column layout (on desktop) or stacked (mobile).
    - **Left Column ("Basic Info"):**
        - `Title` (Input, required): The name of the prompt.
        - `Collection` (Dropdown): Select parent collection. Displays collection title and recursive prompt count `(N)`.
        - `Tags` (Multi-select/Input): Add relevant tags.
        - `Description` (Textarea): Brief explanation of purpose.
    - **Right Column ("Prompt Content"):**
        - `Main Prompt` (Textarea/CodeEditor): Large editor for the prompt text. 
        - **Code View Toggle:** Icon button (`Code2`) to switch between plain text area and syntax-highlighted code editor with non-wrapping lines and sticky line numbers (Markdown support).
    - **Collapsible Sections:**
        - `Long Version`: For extended prompt text. Also supports **Code View** toggle.
        - `Usage Example`: For sample inputs/outputs.
        - `Variable Definitions`: Dynamic key-value pair list.
            - Includes "Auto Add Variables" button to scan both Main Prompt and Long Version for `{{variable}}` or `[variable]` patterns.
            - Includes "Description" field for each variable.
    - **Result & Attachments:**
        - Optional fields to upload an example result image or paste result text.
        - File upload for attachments.
- **Action:** Primary "Create Prompt" button at the bottom right.



---

### 2. View Prompt Details
**As a** User
**I want to** view the full details of a specific prompt, including its versions and metadata
**So that** I can understand how to use it or copy the content.

**UI/UX Description:**
- **Interface:**
    - **Header:** Displays Title, Tags, "Created by", Created/Updated dates.
    - **Action Bar:** Buttons for "Edit", "New Version", "Copy to Clipboard". (*Delete button pending implementation*).
    - **Content Area:** 
        - Displays the Prompt Content in a copyable code block or **Code View** (toggleable to show line numbers/syntax highlighting).
        - Displays Description, Usage Examples, and Variable Definitions.
    - **Metadata Sidebar/Section:** 
        - **Collections:** List of collections the prompt belongs to, displayed as pills with `Title (N)` recursive count.
        - **Fill Variables (Interactive):** Inputs generated for each variable defined in the prompt. Allows users to type values and see them dynamically substituted in the prompt text before copying.
        - Shows Stats (Views, Copies).
    - **Version History:** A list or tabs showing previous versions of this prompt.
    - **Note on Deletion:** While a 'Delete' requirement exists, the current interface primarily exposes 'Edit/New Version'. Deletion might be handled via a context menu or edit page (pending Implementation verification).



---

### 3. Create a New Version
**As a** User
**I want to** create a new version of an existing prompt without overwriting the history
**So that** I can iterate on the prompt logic while preserving the original for comparison.

**UI/UX Description:**
- **Navigation:** "New Version" button on the Prompt Detail page.
- **Interface:** 
    - Similar to the Create form, but pre-filled with the current prompt's data.
    - Includes a `Changelog` input field to describe what changed in this version.
    - Saves as a new `PromptVersion` linked to the same parent `Prompt`.

---

### 4. Delete a Prompt
**As a** User
**I want to** permanently delete a prompt I created
**So that** I can remove obsolete or incorrect content.

**UI/UX Description:**
- **Action:** Delete icon/button on the Prompt Detail page or within a list view context menu.
- **Confirmation:** A modal or browser confirm dialog ("Are you sure...") to prevent accidental deletion.
- **Feedback:** Redirects to the dashboard or collection list with a success notification.

---

### 5. Managing Variables
**As a** User
**I want to** define and describe variables used in my prompt (e.g., `{{topic}}`)
**So that** others understand what inputs are required.

**UI/UX Description:**
- **Interaction:** 
    - Users can manually add rows for keys and descriptions.
    - **"Auto Add Variables" Button:** A smart feature that regex-scans the prompt content for curly braces `{{...}}` or square brackets `[...]` and automatically populates the variable list.
