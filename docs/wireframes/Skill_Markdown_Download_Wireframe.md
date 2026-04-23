# Wireframe: Professional Skill Markdown Download

## 1. Overview
This wireframe describes the layout and structure of the professional Markdown file generated when a user clicks "Download Markdown" for a prompt or skill.

## 2. Before Implementation (Legacy Format)
```markdown
# [Title]
> [Description]

---
SPECIALIST AGENT
[Agent Usage Content]

---
CONDITIONAL SPECIALIST SKILLS
[Skills list as single bullet points]
```

## 3. After Implementation (Premium Structured Format)
```markdown
# [Title]

> [Description]

**Version:** [X] | **Date:** [YYYY-MM-DD] | **Author:** [Name]
**Tags:** [Tags]

---

## Prompt Content
```text
[Content]
```

## Agents
[Agent Usage Content]

## Agentskills
The following agentskills could be used to achieve the goals of this prompt and its tasks
* [Name]
** [Description]
** [URL]

## Variables
[Variables Table]

## Metadata
* Collection: [Name]
* Source: [URL/Path]
```

## 4. Key Changes
- **Semantic Headers**: Using `## Agents` and `## Agentskills` instead of horizontal rule separators and all-caps labels.
- **Introductory Text**: Added mandatory introductory text for the Agent Skills section.
- **Nested Structure**: Using specific bullet levels for skills (Level 1 for name, Level 2 for description and URL).
- **Consistency**: Simplified the "Agents" section to match the new header style.

## 5. Rationale
The new format is designed to be "Agent-friendly". The specific introductory text in the Agentskills section explicitly tells an AI agent to look for these skills in its path, which is a critical feature for the Agentskills ecosystem.
