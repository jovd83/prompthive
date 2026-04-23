# Technical Documentation: Advanced Copy Features

## 📋 Feature Overview
The **Advanced Copy** feature replaces the previous static copy buttons with a centralized, modular copying mechanism. Users can now selectively append various project policies, agent instructions, and user handoff sections to their prompt content.

## 🏗️ Technical Implementation

### 1. Unified Clipboard Logic
The copying logic is refactored into an `AdvancedCopyDropdown` or similar component within `PromptDetail.tsx`.

| Option | logic | Enabled Condition |
| :--- | :--- | :--- |
| **Normal Copy** | `replaceVariables(content)` | Always |
| **Add Agents** | Appends `agentUsage` | `version.agentUsage` is not empty |
| **Add Agent Skills** | Appends selected skills | `selectedAgentSkills` is not empty |
| **SOT Policy** | Appends `SOURCE_OF_TRUTH_CHECK` | Always |
| **Persistence Check**| Appends `PERSISTENCE_CHECK` | Always |
| **User Handoff** | Appends `USER_HANDOFF` | Always |

### 2. UI Components
- **`PromptDetail.tsx`**: 
    - Removes the `copyWithSot` button.
    - Updates `handleCopy` to be "clean" by default (no agents/skills).
    - Adds an `AdvancedCopyOptions` UI block (likely a dropdown or collapsible) with checkboxes.
- **Iconography**:
    - **Normal Copy**: `Copy`
    - **Advanced Options**: `ChevronDown` or `Settings2`

### 3. Policy Content (Constants)
Policies are stored as constants in a dedicated library file (e.g., `lib/policies.ts`) to avoid cluttering components.

### 4. Localization
New keys added to `locales/`:
- `detail.actions.advancedCopy`: "Advanced Copy"
- `detail.actions.addAgents`: "Add agents"
- `detail.actions.addAgentSkills`: "Add agentskills"
- `detail.actions.addSotPolicy`: "Add source-of-truth policy"
- `detail.actions.addPersistenceCheck`: "Add persistence check"
- `detail.actions.addUserHandoff`: "Add user handoff"

### 5. Analytics
- Event type: `copy_advanced`
- Payload: `{ promptId: string, options: string[] }`

## ✅ Verification
- **Unit Tests**: Test the `formatAdvancedCopy` utility function with various combinations of flags.
- **E2E Tests**: Verify the clipboard result for different checkbox selections in Playwright.
