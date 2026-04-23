# Wireframe: Agent & Agent Skill Integration

## 1. UnifiedPromptForm Update (Create/Edit Prompt)

The form will include two new collapsible sections immediately after the **Variables** section:

### Use of Agents
- **Label**: Use of agents
- **Component**: `ExpandableTextarea`
- **Placeholder**: e.g., "Use a Researcher agent to gather initial data, then an Analyst to process it."
- **Help Text**: This content will be appended to the clipboard when copying the prompt.

### Use of Agent Skills
- **Label**: Use of agentskills
- **Component**: Scrollable List of Checkboxes
- **Layout**: 
  - Each item shows: `[Checkbox] Skill Title`
  - Tooltip or sub-text shows the Skill Description.
- **Default State**: All unchecked.
- **Help Text**: Selected skills will be appended to the clipboard when copying the prompt.

## 2. Prompt Detail View
The detail view will display these chapters if they are not null/empty.

### Agent Instructions
- **Title**: Use of agents
- **Content**: The stored text.

### Required Agent Skills
- **Title**: Use of agentskills
- **Content**: List of selected skills (Name and Description).
