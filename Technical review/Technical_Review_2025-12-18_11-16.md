# Refactoring Roadmap

**Date:** 2025-12-18
**Author:** Antigravity (Senior Principal Engineer)

## 1. Executive Summary

The application exhibits classic characteristics of a "rapidly evolved" prototype. While the core functionality works and security basics (Zod validation in Server Actions) are present—a pleasant surprise—the codebase suffers from significant **God Component** syndrome and loose typing (`any`) in critical UI integration points.

The most dangerous pattern observed is the mixing of complex data parsing (`JSON.parse` of variable definitions) directly inside client-side components (`PromptDetail`), coupled with heavy logic (diffing, analytics) that should be abstracted into hooks.

## 2. Refactoring Matrix

| File / Location | Severity | Smell Detected | Why it's bad | The Fix |
| :--- | :--- | :--- | :--- | :--- |
| [`components/PromptDetail.tsx`](../components/PromptDetail.tsx) | **CRITICAL** | God Component (>500 lines) | Mixes presentation, complex JSON parsing, analytics side-effects, diff state management, and data transformation. Hard to test or maintain. | Extract logic to `hooks/usePromptDetails.ts`. Move `VariableDef` parsing to a util `lib/prompt-utils.ts`. Extract `ResultsSection` and `PromptHeader` sub-components. |
| [`prisma/schema.prisma`](../prisma/schema.prisma) | **HIGH** | Schema Hacking / Primitive Obsession | Storing `variableDefinitions` and `inputMappings` as raw Strings instead of structured data. Requires fragile `JSON.parse` everywhere. | **Ideal:** Switch to Postgres/MySQL for `Json` type. <br>**Practical:** Add a Zod schema for this field and creating a strictly typed Data Access Layer (DAL) wrapper that parses it at the service boundary, never exposing the string to the UI. |
| [`components/PromptDetail.tsx`](../components/PromptDetail.tsx) | **HIGH** | "Ghost Logic" / Fragile Parsing | Parsing JSON (`JSON.parse`) blindly inside a `useMemo` (lines 103-111). If the schema data is corrupt, the UI crashes or behaves unpredictably silently. | Move parsing to the Server Component or Service Layer. Pass fully typed objects to the Client Component, not raw strings. |
| [`app/scraper-actions.ts`](../app/scraper-actions.ts) | **MEDIUM** | File Location / Organization | Server Actions logic lives inside `app/` instead of `actions/`. Confusing separation of concerns. | Move to `actions/scraper.ts`. |
| [`actions/prompts.ts`](../actions/prompts.ts) | **MEDIUM** | Magic Strings | Hardcoded auth redirects (`/api/auth/signout...`) and role checks. | Extract constants to `lib/constants.ts` or `lib/routes.ts`. |
| [`components/*.tsx`](../components) | **MEDIUM** | The "Any" Virus | Multiple files (e.g., `PromptDetail.tsx`, `scraper-actions.ts`) use `any` to bypass type checks or handle external libraries. | Replace `any` with specific types. For `scraper-actions`, define a `ScraperError` type. |
| [`components/SettingsForm.tsx`](../components/SettingsForm.tsx) | **MEDIUM** | Component Bloat | Large form component (~19KB) handling unrelated settings groups. | Split into `GeneralSettings.tsx`, `ProfileSettings.tsx`, etc. |

## 3. Detailed Architectural Recommendations

### A. The Service Layer Pattern
Currently, `actions/prompts.ts` does validation and then calls `services/prompts.ts`. This is **Good**. However, the Service layer returns raw Prisma types which include the JSON strings. 
*   **Recommendation:** The Service layer should return *Domain Objects*.
    *   *Raw:* `Prompt { variableDefinitions: string }`
    *   *Domain:* `PromptDomain { variableDefinitions: VariableDef[] }`
    *   This forces the parsing to happen reliably on the server, ensuring the Client Component never sees a malformed string.

### B. "Use Client" Boundaries
`PromptDetail.tsx` is a Client Component. It shouldn't be responsible for parsing data that exists in the DB.
*   **Refactor:**
    1.  Fetch data in `app/prompts/[id]/page.tsx` (Server Component).
    2.  Parse JSON strings there.
    3.  Pass ready-to-use objects to `PromptDetail`.
    4.  `PromptDetail` becomes a "dumb" presentational component (or stricter state manager) without data transformation logic.

### C. Zod Validation
You are correctly using Zod (`CreatePromptSchema`) inside Server Actions. **Keep doing this.** Do not move validation to the client only.

## 4. Next Steps

1.  **Phase 1 (Safety):** Fix the `JSON.parse` fragility in `PromptDetail` by moving it to a utility function with strict Zod validation validation.
2.  **Phase 2 (Cleanup):** Move `app/scraper-actions.ts` to `actions/`.
3.  **Phase 3 (Architecture):** Refactor `PromptDetail.tsx` by extracting `usePromptLogic` hook.

