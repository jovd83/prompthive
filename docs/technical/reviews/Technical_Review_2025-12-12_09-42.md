# Refactoring Roadmap

## Executive Summary
This audit reveals a classic "Vibe Coded" application. While functional, the codebase suffers from significant architectural coupling, type safety evasion, and monolithic file structures. The application relies heavily on Next.js 14 features but bypasses established patterns for data validation and separation of concerns.

**Critical Weakness**: The complete absence of runtime validation (Zod) combined with rampant `any` usage creates a fragile system where data integrity is assumed rather than enforced.

## Detailed Findings

| File/Location | Severity | Smell Detected | Why it's bad | The Fix |
| :--- | :--- | :--- | :--- | :--- |
| [`app/actions.ts`](d:/cursor_projects/prompt%20library/app/actions.ts) | **Critical** | Action Spaghetti | A single file (387 lines) handles Auth, DB, Backups, and Imports. If one import fails, the entire backend layer breaks. Violates Single Responsibility Principle. | Split into domain-specific files: `actions/prompts.ts`, `actions/collections.ts`, etc. |
| [`app/actions.ts`](d:/cursor_projects/prompt%20library/app/actions.ts) | **Critical** | Validation Location | `FormData` is cast to strings (`as string`) without validation. `createPrompt` blindly trusts input. | Implement Zod schemas for all inputs. Validate using `schema.parse()` *inside* the action before touching the Service. |
| [`services/prompts.ts`](d:/cursor_projects/prompt%20library/services/prompts.ts) | **High** | N+1 Query | `deletePromptService` loops through tags and calls `prisma.prompt.count` for *each* tag sequentially. | Refactor to use a single `prisma.tag.deleteMany` with a `where` clause checking for usage, or use a `groupBy` count query first. |
| [`components/PromptDetail.tsx`](d:/cursor_projects/prompt%20library/components/PromptDetail.tsx) | **High** | God Component | 419 lines. Mixes UI, Analytics Fetching, Clipboard logic, JSON parsing, and specific diffing logic. | Extract logic: `usePromptAnalytics` hook, `usePromptClipboard` hook. Move `VisualDiff` config state to a sub-component. |
| [`components/Sidebar.tsx`](d:/cursor_projects/prompt%20library/components/Sidebar.tsx) | **Medium** | Use Client Trap | Large client component (455 lines) handling mostly static navigation but marked `use client` due to some state. Slows hydration. | Extract the `SortMenu` and `CollectionTreeItem` into their own client components. Keep the shell Server Side if possible, or minimize the client surface area. |
| [`services/prompts.ts`](d:/cursor_projects/prompt%20library/services/prompts.ts) | **High** | The "Any" Virus | `const updateData: any = ...` (Line 220). Bypasses TypeScript safety for Prisma updates. | Define strict input types for Prisma updates. Use `Prisma.PromptUpdateInput` to ensure type safety. |
| [`components/PromptDetail.tsx`](d:/cursor_projects/prompt%20library/components/PromptDetail.tsx) | **Medium** | Schema Hacks | Manual `JSON.parse` logic (Line 40) for `variableDefinitions`. Robustness relies on a try-catch block in UI code. | Move parsing logic to the Model/Service layer or a utility `parsePromptMetadata` function that returns a typed object/safe default. |
| [`app/actions.ts`](d:/cursor_projects/prompt%20library/app/actions.ts) | **Medium** | Leaky Abstractions | `JSON.parse` happens inside the Action (Lines 191, 211, 337). If the JSON is invalid, it throws a 500 error directly from the action. | Use `safeParse` from Zod or a try-catch block that returns a `{ success: false, error: ... }` object, not a thrown error. |
| [`app/scraper-actions.ts`](d:/cursor_projects/prompt%20library/app/scraper-actions.ts) | **Low** | Magic Strings | Likely contains hardcoded selectors or paths (inferred from filename). | Move scraper configs to a constant file or database configuration unless they are highly dynamic. |
| [`components/CollectionSplitView.tsx`](d:/cursor_projects/prompt%20library/components/CollectionSplitView.tsx) | **Low** | Prop Drilling / Any | `{ collection, ... }: any`. The component doesn't know what shape `collection` is. | Create a `CollectionWithPrompts` type in `types/index.ts` and use it. |

## Refactoring Roadmap

### Phase 1: Security & Stability (Immediate)
1.  **Install Zod:** `npm install zod`.
2.  **Schema Enforcement:** Create `lib/validations/prompt.ts` with Zod schemas.
3.  **Secure Actions:** Rewrite `createPrompt` and `createVersion` in `app/actions.ts` to use `schema.safeParse(formData)`.
4.  **Kill `any`**: Go through `services/prompts.ts` and replace `any` with generated Prisma types (`Prisma.PromptGetPayload<...>`).

### Phase 2: Decoupling (High Value)
1.  **Explode `app/actions.ts`**: Create `actions/prompt-actions.ts`, `actions/collection-actions.ts`.
2.  **Service Layer Cleanup**: optimize `deletePromptService` to avoid the loop.
3.  **Component Diet**: Extract `CollectionTree` from `Sidebar.tsx`.

### Phase 3: Documentation & Hygiene
1.  **Type Parsed JSON**: Create a type `VariableDefinition` and a helper function to parse it safely, replacing ad-hoc `JSON.parse`.
2.  **Server Component Boundary**: Analyze if `Sidebar` needs to be fully client-side. Likely only the interactive tree needs to be.
