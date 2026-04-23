---
title: Epic_Advanced_Workflows
version: 2.1
last_updated: 2025-12-23
status: Live
---

# Epic: Advanced Workflows

## User Story: Create Workflow
**As a** User
**I want to** chain prompts together
**So that** I can build complex automation sequences.

### 1. Description
Users can create a workflow by adding multiple prompts in a specific order. They can map the variables of a prompt to the output of a previous step.

### 2. Technical Scope & Fields
*Derived from Code (components/WorkflowEditor.tsx)*

*   **Header**: Title, Description, Save Button.
*   **Steps List**: Reorderable list of prompts.
    *   **Step**: Shows Prompt Title, Order Index.
    *   **Variable Mapping**: For each variable in the prompt:
        *   **Source**: Dropdown - "User Input" OR "Step [X] Output".
*   **Add Step**: Button + Search Modal to select prompts.

### 3. Acceptance Criteria (AC)
*   [ ] Verify identifying variables in added prompts automatically.
*   [ ] Verify that selecting "Step Output" maps the data flow correctly.
*   [ ] Verify saving persists the mappings and order.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/workflow_editor.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** 2-Column (Steps Builder | Logic Info).
*   **Key Elements:**
    *   Step Card: Title, "Move Up/Down", "Remove".
    *   Variable Inputs: Label + Source Select.
    *   "Add Step" Button.

---

## User Story: Execute Workflow
**As a** User
**I want to** run a workflow
**So that** I can perform the task step-by-step.

### 1. Description
The runner executes steps sequentially. For each step, it requests user inputs (if not already mapped), displays the compiled prompt (for copying to AI), and captures the AI response.

### 2. Technical Scope & Fields
*Derived from Code (components/WorkflowRunner.tsx)*

*   **Progress Indicators**: Step X of Y, Progress Bar.
*   **Input Section**:
    *   **Required Inputs**: Form for variables mapped to "USER_INPUT".
    *   **Compiled Prompt**: Textarea (Read-Only) - The final string to send to AI.
*   **Output Section**:
    *   **Result Input**: Textarea - User pastes the AI's response here.
    *   **Action**: "Next Step" / "Finish".

### 3. Acceptance Criteria (AC)
*   [ ] Verify that variables mapped to previous steps are auto-filled.
*   [ ] Verify that "Next Step" is disabled until output is provided.
*   [ ] Verify that finishing the workflow displays a summary of all steps.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/workflow_editor.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Split View (Inputs/Prompt | Result/Action).
*   **Key Elements:** Progress Bar, Compiled Prompt Box (Copy code style), Result Textarea, "Next Step" Button.

