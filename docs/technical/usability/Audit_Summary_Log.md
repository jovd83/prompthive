# Usability & Accessibility Audit Log

**Date:** 2025-12-10
** auditor:** Antigravity (Lead A11y & QA Engineer)

## 1. Routes Audited
The following routes were tested using Lighthouse (running against `localhost:3000`):

| Route Name | URL | Report File |
| :--- | :--- | :--- |
| **Dashboard** | `http://localhost:3000` | `Dashboard_20251210-0923.html` |
| **Login** | `http://localhost:3000/login` | `Login_20251210-0924.html` |
| **Create Prompt** | `http://localhost:3000/prompts/new` | `CreatePrompt_20251210-0924.html` |

## 2. Report Location
All HTML reports are located in the `usability a11y report/` directory. Open these files in a browser to view the detailed Lighthouse scores and specific issue breakdowns.

## 3. Static Code Analysis Findings (Axe/Manual)
Simultaneous to the dynamic audit, a static scan of the codebase (`components/`) was performed to identify common accessibility anti-patterns.

### 🔴 Critical Issues
*   **Missing Label Associations (Forms)**
    *   **Location:** `CreatePromptForm.tsx`, `SettingsForm.tsx` (and potentially others).
    *   **Issue:** Form inputs are often placed as siblings to `<label>` elements without a programmatic link.
    *   **Code Smell:**
        ```tsx
        <label className="...">Title</label>
        <input name="title" ... />
        ```
    *   **Impact:** Screen readers will not announce the label when the user focuses the input.
    *   **Remediation:** Either wrap the input in the label (`<label>Title <input ... /></label>`) or use `htmlFor="id"` on the label and matching `id` on the input.

### 🟡 Warnings & Code Smells
*   **Interactive Non-Interactive Elements**
    *   **Location:** `components/CollapsibleSection.tsx` (Line 18)
    *   **Issue:** A `<div>` element has an `onClick` handler.
    *   **Code Smell:** `<div onClick={(e) => e.stopPropagation()}>{action}</div>`
    *   **Context:** This is used to prevent the accordion from toggling when the action button is clicked. However, generic `div`s with click handlers are flagged by accessibility tools.
    *   **Remediation:** Verify if this container needs `role="presentation"` or if the event handling can be moved to the button itself.

### 🟢 Good Practices Observation
*   **Image Alt Text:** Scans of `Sidebar.tsx` and `PromptDetail.tsx` show that `<img>` tags generally include `alt` attributes, which is excellent for screen readers.

## 4. Recommendations
1.  **Fix Form Labels:** Prioritize refactoring `CreatePromptForm.tsx` and `SettingsForm.tsx` to properly associate labels. This will significantly improve the Accessibility score.
2.  **Review Lighthouse Reports:** Open the HTML files to catch contrast issues, missing aria attributes, or structure issues flagged during the runtime scan.
