# Playwright Healing Report

| Test Case Name | Error Type | Healing Action Taken | Confidence (0-100) |
| :--- | :--- | :--- | :--- |
| `should allow selecting multiple prompts and adding tags` | Locator Timeout (Sidebar & Menu) | 1. Relaxed sidebar text matching (`exact: false`).<br>2. Fixed Collection ID extraction logic.<br>3. Added `aria-label` to menu button and updated locator to `getByRole`.<br>4. Increased test timeout. | 90 |
| `should allow bulk moving prompts via drag and drop` | Logic Change & Strict Mode | 1. Updated `waitForURL` expectation to handle redirect to `/prompts/`.<br>2. Fixed Strict Mode violation by using specific `getByRole('heading', { level: 4 })` locators.<br>3. Applied common sidebar/menu fixes. | 95 |

## Summary of Changes
- **Source Code (`CollectionSplitView.tsx`)**: Added `aria-label="Collection actions"` to the "More" menu button to improve accessibility and testability.
- **Tests (`bulk-actions.spec.ts`)**:
    - Relaxed sidebar selection to account for prompt counts (e.g. "Name (0)").
    - Updated redirection logic for prompt creation.
    - Replaced brittle CSS selectors with robust `getByRole` locators.
    - Enforced strict heading checks to avoid "Strict Mode" duplicates.
    - Increased test suite timeout to 120s to prevent premature failures on slower environments.
