---
id: US-102
title: Enhanced Markdown Download for Skills and Agents
actor: User
status: Draft
priority: Medium
epic: Epic_Agent_Integration
---

# US-102: Enhanced Markdown Download for Skills and Agents

**As a** User
**I want to** have a structured markdown download of my prompts and skills
**So that** I can easily share the required agents and agent skills with other tools or users in a standardized format.

## Context
The current markdown download provides a basic overview but does not follow the newly required structured format for Agents and Agent Skills. This feature ensures that the downloaded file is professional and easily parsable by both humans and AI.

## Business Rules
- The "Agentskills" section must only appear if agent skills are linked.
- The "Agents" section must only appear if agent usage is defined.
- The formatting must strictly follow the requested template.

## Acceptance Criteria

### Scenario 1: Markdown download with Agent Skills
**Given** a prompt has multiple linked agent skills
**When** the user downloads the prompt as Markdown
**Then** the file should contain a "## Agentskills" header
**And** it should include the introductory text "The following agentskills could be used to achieve the goals of this prompt and its tasks"
**And** for each linked skill, it should list:
  - The skill name as a bullet point (`* $AgentSkillName`)
  - The skill description as a sub-bullet (`** $AgentSkillDescription`)
  - The skill URL as a sub-bullet (`** $AgentSkillURL`)

### Scenario 2: Markdown download with Agent Usage
**Given** a prompt has internal agent usage instructions
**When** the user downloads the prompt as Markdown
**Then** the file should contain a "## Agents" header
**And** it should be followed by the verbatim agent usage content from the prompt version.

### Scenario 3: Markdown download with no Agents or Skills
**Given** a prompt has no agents or skills linked
**When** the user downloads the prompt as Markdown
**Then** the "Agents" and "Agentskills" sections should be omitted.

## Technical Notes
- Target file: `lib/markdown.ts`
- Ensure `selectedAgentSkills` passed to `generateMarkdown` contain `title`, `description`, and `url`/`repoUrl`.
- Markdown levels: The user requested `*` and `**`. In standard Markdown this renders as a first-level list item and a bold text. However, if intended as a nested list, we should ensure it renders clearly. We will use the literal `*` and `**` as requested but ensuring valid Markdown spacing.

## Testing Strategy
- **Unit Tests**: Update `lib/markdown.test.ts` to verify the new string structure.
- **E2E Tests**: Update Playwright tests in `frontend-tests/agent_integration.spec.ts` to verify the download action and content (by mocking or checking the generated blob).

## Definition of Done
- [ ] Code implemented in `lib/markdown.ts`
- [ ] Unit tests pass with >=80% coverage
- [ ] Playwright E2E tests verified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
