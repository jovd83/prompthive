# User Story: Agent & Skill Integration in Skills

**Story ID:** US-101
**Epic/Feature:** Agent & Agent Skill Integration
**Priority:** High
**Story Points:** 3
**Status:** In Progress

**Detailed Progress:**
- [x] Functional / Business Analysis
- [x] UX / UI Design
- [x] Architectural Work
- [x] Backend Development
- [x] Frontend Development
- [ ] Plugin / Integration Development (N/A)
- [x] Unit Testing
- [ ] Service Testing / E2E Testing
- [ ] Frontend Testing
- [ ] Technical Review
- [ ] Technical Refactoring
- [ ] Functional Review
- [ ] Product Owner Review
- [x] Documentation

---

## User Story

**As a** Power User
**I want** to declare agent dependencies and instructions for Agent Skills
**So that** when I use a skill, the AI agent has the correct specialist context and tool constraints.

---

## Context
Currently, only regular Prompts support Agent and Agent Skill declarations. Since Agent Skills are themselves specialist prompts, they must also support these declarations to allow for complex skill dependency chains and autonomous specialist handovers.

---

## Data Model (Fields)

| Field | Technical Specs | Business Purpose & Functional Use Case |
| :--- | :--- | :--- |
| url | String, Optional | Dedicated URL for the skill (docs, home, etc.). Distinct from the technical repoUrl. |
| agentUsage | String, Optional | Defines instructions for specialized agents (e.g. Researcher, Analyst). |
| agentSkillIds | JSON array of strings, Optional | Defines dependencies on other Agent Skills required for execution. |

---

## WebApp (UI) Interaction

1. Navigation: Skills > Create/Edit Skill
2. Access: Form Chapters
3. Trigger: Input change
4. Action: Fill URL or Import URL
5. Result: Data persists on Save

---

## API (REST) Contract

- Endpoint: POST /api/skills
- Method: POST
- Authentication: JWT / Session
- Request Body:
```json
{
  "title": "My Skill",
  "url": "https://example.com/skill",
  "repoUrl": "https://github.com/user/repo",
  "agentUsage": "Use Researcher",
  "agentSkillIds": []
}
```
- Response: 200 OK
- Error Codes:
    - 400 Bad Request: Validation failure

---

## Functional Requirements

1. URL Support: Skills must have a dedicated field for a primary URL (home page, documentation).
2. Agent Instruction Support: Skills must have a dedicated chapter for agent-specific instructions.
3. Skill Dependency Support: Skills must allow selecting other Agent Skills as dependencies.
4. Advanced Copy Fidelity: When a skill is copied via "Advanced Copy", its own agent instructions and dependencies must be included in the payload.

---

## Acceptance Criteria

### Scenario 1: Declare dependencies for a new skill
**Given** I am on the "Create New Agent Skill" page
**When** I fill in the details and select two related skills in the "Use of agentskills" section
**Then** the new skill should be saved with those two dependencies.

### Scenario 2: Edit a skill's URL and agent instructions
**Given** an existing skill has agent instructions
**When** I edit the "URL" and "Use of agents" chapter and save
**Then** the updated URL and instructions should be visible in the skill detail view.

---

## Business Rules
- A skill cannot depend on itself.
- Only prompts with itemType: 'AGENT_SKILL' are listed in the dependencies checkbox list.
- If both `url` and `repoUrl` are provided, `url` is treated as the primary display URL.

---

## Non-Functional Requirements

### Usability
- The Agent sections must be collapsible to preserve space in the Skill form.
- The Skill dependency list must be scrollable to handle large registries.
- The URL field should provide an external link button in the detail view.

---

## QA & Testing Strategy
- Unit Tests: Verify copy-utils.ts handles Skill context correctly.
- E2E Tests: Verify creation and editing of skills with the new URL field.

---

## Functional / Business References
- Epic: Agent & Agent Skill Integration

## Source Traceability
- [x] `components/PromptDetail.tsx`: Add a "URL" field to the Agent Skill information pane, below the Installation field.
- [x] `components/UnifiedSkillForm.tsx`: Ensure the URL and Import URL are clearly presented and handled.
- [x] `services/prompt-crud.ts`: Support `url` in service layer.
- [x] `prisma/schema.prisma`: Add `url` to Prompt model.
- [ ] `lib/copy-utils.ts`: Ensure URL is included in clipboard if needed (though not explicitly requested, it's good practice).
- [ ] `app/api/export/route.ts`: (Verified) Already includes `repoUrl`.
- [ ] `services/imports.ts`: (Verified) Already includes `repoUrl`.
