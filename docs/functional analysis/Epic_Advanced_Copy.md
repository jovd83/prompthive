---
title: Epic_Advanced_Copy
version: 1.0.0
last_updated: 2026-04-19
status: Completed
---

# Epic: Advanced Copy Features

## User Story: Advanced Copy Options
**As a** User
**I want to** customize the content being copied to the clipboard
**So that** I can include relevant project context, policies, and handoff instructions only when needed.

### 1. Description
The existing "Copy" and "Copy with SOT Policy" buttons are consolidated into a more flexible "Advanced Copy" feature. The "Normal Copy" button now only copies the prompt content (with variables replaced). A new "Advanced Copy" section (or toggle/modal) provides checkboxes to optionally append additional content to the clipboard.

### 2. Feature Requirements (Acceptance Criteria)
*   [x] **Refactor Existing Buttons**:
    *   Standard "Copy" button: No longer appends agents or agentskills.
    *   "Copy with SOT Policy" button: Removed.
*   [x] **Advanced Copy Section**:
    *   A new UI element (e.g., a menu, dropdown, or expandable section) allows selective copying.
    *   Features five checkboxes, all **unchecked by default**.
*   [x] **Checkbox: Add agents**:
    *   When checked, appends the "Use of agents" section.
    *   Disabled/Grayed out if the `agentUsage` field for the selected version is empty.
*   [x] **Checkbox: Add agentskills**:
    *   When checked, appends the "Use of agentskills" section.
    *   Disabled/Grayed out if no agent skills are selected for the prompt.
*   [x] **Checkbox: Add source-of-truth policy**:
    *   When checked, appends the mandatory "SOURCE-OF-TRUTH CHECK" text (new version).
*   [x] **Checkbox: Add persistence check**:
    *   When checked, appends the "PERSISTENCE CHECK" text.
*   [x] **Checkbox: Add user handoff**:
    *   When checked, appends the "Handoff section" text.
*   [x] **Copy Action**: Clicking "Copy" within the advanced section performs the composite copy based on selections.

### 3. Policy Content (Fixed Strings)

#### SOURCE-OF-TRUTH CHECK
```text
SOURCE-OF-TRUTH CHECK

Do not treat training knowledge, cached memory, or prior conversation context as authoritative.
Before planning, answering, or acting, you must check the current source of truth for this task: relevant files, SKILL.md instructions, registries, templates, metadata, and policy artifacts.
If a required Information Layer or Feedback Layer skill exists for upfront verification, you must use it. Referring to a skill from memory does not count as using it.
If current sources conflict with memory, current sources win.
If a required skill includes telemetry, logging, or workflow evidence, complete it.
If a required source, skill, or verification path is unavailable, stop and report the blocker instead of guessing.
Ground your work in checked current sources, not recalled knowledge.
```

#### PERSISTENCE CHECK
```text
PERSISTENCE CHECK

Before finalizing, you must review whether this task produced anything that should be written away as durable memory, policy, convention, template guidance, or handoff state.
For each candidate, assign exactly one destination:
- runtime-only
- project-memory
- shared-memory
- reject
Write only items that are stable, reusable, safe, and backed by current checked sources.
Do not write secrets, speculative ideas, one-off task notes, or hidden-context details into persistent memory.
If a memory or policy skill exists for writing or validating persistence, use it. Read before write, and avoid duplicates by updating or deprecating existing entries when appropriate.
If nothing qualifies, explicitly say:
"No project-memory or shared-memory write was warranted after review."
```

#### USER HANDOFF
```text
End with a short Handoff section listing:
- status
- next step
- memory/policy writes performed
- writes intentionally skipped, with reason
- Information skill(s) used:
- Feedback skill(s) used:
- Execution skill(s) used:
- Current source(s) checked:
- Telemetry/logging:
- Any remaining uncertainty:
- blockers or risks
```

### 4. Technical IDs
*   `FEAT-ADV-COPY-01`: Advanced Copy Feature
*   `POLICY-SOT-02`: Source-of-Truth Policy (V2)
*   `POLICY-PERS-01`: Persistence Check Policy
*   `POLICY-HANDOFF-01`: User Handoff Section
