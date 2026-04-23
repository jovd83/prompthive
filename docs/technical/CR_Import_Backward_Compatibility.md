### Change Request: Backward Compatibility for Imports

#### 🔍 Impact Analysis
- **Impacted epics/stories**: Epic_Data_Management.md (User Story: Import Data)
- **Unchanged assumptions**: The core import logic remains valid; we are only widening the gate.
- **Deprecated or altered behavior**: Strict schema validation was relaxed to allow "messy" data types (mixed strings/arrays) which are then normalized by the service layer.

#### 📘 Updated Functional Analysis (`docs/functional analysis/`)
- Updated **Epic_Data_Management.md**:
  - Added Acceptance Criterion: "Verify Unified Import accepts legacy JSON formats (e.g. string tags, missing optional fields) without error."
  - Why: To ensure long-term support for older backup files.

#### 🎨 Wireframes / UX (`docs/wireframes/`)
- **No Change**: The UI for import remains identical; only immediate validation error on the backend is resolved.

#### 🧠 Technical Documentation & Diagrams
- **Updated docs**: `docs/functional analysis/Data_Migration_Impact.md` (Created)
- **Summary**: Identified strict Zod schema as the blocker. Relaxed `lib/validations.ts` to use `z.any()` or `z.union` for permissive fields.

#### 💻 Code Changes
```typescript
// lib/validations.ts - Relaxed Schema
tags: z.union([z.string(), z.array(z.any())]).optional(),
collections: z.union([z.string(), z.array(z.any())]).optional(),
versions: z.array(z.any()).optional(),
// .passthrough() added to allow extra fields
```

#### ✅ Unit Tests & Coverage
- **Why existing tests failed**: No tests existed for "dirty" legacy data; only "clean" data was tested.
- **New tests**: `services/import-validation.test.ts` covers 4 scenarios of legacy data.
- **Coverage**: Added specific validation coverage for legacy paths.

```typescript
// services/import-validation.test.ts
it('should partially validate legacy JSON where tags are strings instead of array', ...)
it('should partially validate legacy JSON with missing optional fields', ...)
```

#### 🌐 Playwright Tests (`frontend-tests/`)
- **Scope**: Existing import E2E tests (`frontend-tests/import-export.spec.ts`) cover the happy path. Since we don't have a reliable repository of "legacy" files committed to the repo for E2E, the unit tests in `services/import-validation.test.ts` provide the necessary safety net for this logic change.

#### 📄 User Documentation
- **No update required**: The feature "just works" for users who previously experienced errors. No new steps needed.

#### 📘 README.md
- No changes needed.

#### 🧠 AI Reference
- **Change-Request-ID**: CR-IMPORT-BACK-COMPAT-001
- **Internal AI trace key**: `99147fb1-d2ef-4ffa-a575-25584eb0d6b6`
