---
title: Epic_Agent_Integration
version: 1.0.0
last_updated: 2026-04-19
status: Draft
---

# Epic: Agent & Agent Skill Integration

## User Story: Use of Agents in Prompts
**As a** User
**I want to** specify which agents should be used with a prompt
**So that** I can provide better instructions for AI orchestration.

### 1. Description
Users can add an optional "Use of agents" chapter to their prompts. This is a textarea where they can describe which specialized agents (e.g., "Researcher", "Coder") should be invoked. This content is appended to the clipboard when the prompt is copied.

### 2. Technical Scope & Fields
*   **Field**: `agentUsage` (String/Textarea) - Optional.
*   **Storage**: `PromptVersion` model (to allow versioning of instructions).
*   **Clipboard Integration**: Appended only when "Add agents" is selected in Advanced Copy.

### 3. Acceptance Criteria (AC)
*   [ ] Verify "Use of agents" textarea is available in New/Edit Prompt forms.
*   [ ] Verify the field is optional.
*   [ ] Verify data is persisted in `PromptVersion`.
*   [ ] Verify "Copy Prompt" (Normal) does NOT append the agent usage text.
*   [ ] Verify the field is included in Import/Export JSON.

---

## User Story: Use of Agent Skills in Prompts
**As a** User
**I want to** select agent skills that are relevant to a prompt
**So that** I can specify required capabilities for AI tools.

### 1. Description
Users can select one or more "Agent Skills" (Prompts with `itemType: 'AGENT_SKILL'`) from a list. These selected skills are appended to the clipboard when the prompt is copied, including their names and descriptions.

### 2. Technical Scope & Fields
*   **Field**: `agentSkillIds` (JSON array of strings) - Optional.
*   **Storage**: `PromptVersion` model.
*   **UI**: A list of checkboxes showing all available Agent Skills in the system.
*   **Clipboard Integration**: Appends info only when "Add agentskills" is selected in Advanced Copy.

### 3. Acceptance Criteria (AC)
*   [ ] Verify "Use of agentskills" list is available in New/Edit Prompt forms.
*   [ ] Verify all agent skills are listed with checkboxes (default all unchecked).
*   [ ] Verify selected skill IDs are persisted in `PromptVersion`.
*   [ ] Verify "Copy Prompt" (Normal) does NOT append the selected skills info.
*   [ ] Verify the field is included in Import/Export JSON.

---

## User Story: Enhanced Markdown Download for Skills and Agents
**As a** User
**I want to** have a structured markdown download of my prompts and skills
**So that** I can easily share the required agents and agent skills.

### 1. Description
Updates the `generateMarkdown` logic to include dedicated "Agentskills" and "Agents" sections with specific formatting.

### 2. Acceptance Criteria (AC)
*   [ ] Verify "Agentskills" section has the correct introductory text.
*   [ ] Verify skill name, description, and URL are included for each agent skill.
*   [ ] Verify "Agents" section contains the agent usage block.
*   [ ] Verify sections are omitted if empty.

