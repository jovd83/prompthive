# Refactoring Roadmap
**Date:** 2026-01-09 20:30
**Status:** Audit Complete

## Executive Summary
Significant progress has been made in Phase 4. The critical performance bottleneck (N+1 queries) in imports and the monolithic `Sidebar` and `ImportExportContent` components have been resolved.

Primary remaining risks are concentrated in `components/PromptDetail.tsx` (Type Safety/"Any" Virus) and `prisma/schema.prisma` ("Schema Hacks").

## Code Smell Report

| File/Location | Severity | Smell Detected | Why it's bad | The Fix |
| :--- | :--- | :--- | :--- | :--- |
| [components/PromptDetail.tsx](file:///c:/projects/antigravity_prj/prompthive/components/PromptDetail.tsx) | **High** | The "Any" Virus | Uses `(prompt as any)` to access properties like `isLocked` or `technicalId`. Bypasses type safety, risking runtime errors if Schema changes. | Update `PromptWithRelations` type in `types/prisma.ts` to include strict types for relation fields. Remove casting. |
| [prisma/schema.prisma](file:///c:/projects/antigravity_prj/prompthive/prisma/schema.prisma) | **Medium** | Schema Hacks | `variableDefinitions` stored as JSON string. Requires `JSON.parse` in application code, prone to validation errors. | **Long Term:** Normalize to a `Variable` table OR use strict Zod parsing at the boundary (e.g. in `lib/validations.ts` or a new `PromptService`). |
| [components/WorkflowEditor.tsx](file:///c:/projects/antigravity_prj/prompthive/components/WorkflowEditor.tsx) | **Medium** | Approaching God Component | At 279 lines, it mixes UI rendering, drag-and-drop logic, and form state management. | Extract `StepList.tsx` and `WorkflowStepCard.tsx` sub-components. Move drag logic to a custom hook `useWorkflowDrag.ts`. |
| [services/imports.ts](file:///c:/projects/antigravity_prj/prompthive/services/imports.ts) | **Resolved** | N+1 Queries / Any Virus | Was querying DB in loops. | **Use Corrected:** Implemented batch prefetching for Tags/Collections. Enforced `ImportSchema`. |
| [components/Sidebar.tsx](file:///c:/projects/antigravity_prj/prompthive/components/Sidebar.tsx) | **Resolved** | God Component | Was mixing resize, tree recursion, and navigation. | **Use Corrected:** Decomposed into `SidebarCollectionItem` and `useSidebarResize`. |
| [components/ImportExportContent.tsx](file:///c:/projects/antigravity_prj/prompthive/components/ImportExportContent.tsx) | **Resolved** | God Component | Monolithic export/import manager. | **Use Corrected:** Split into 4 specialized form components. |

## Next Steps
1.  **Prioritize:** Fix the "Any" Virus in `PromptDetail.tsx` and strictly type `PromptWithRelations`.
2.  **Refactor:** Pre-emptively decompose `WorkflowEditor.tsx` before it grows further.
