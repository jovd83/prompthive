# Data Migration Impact Analysis: Backward Compatibility for Imports

## 1. Problem Definition
Current import logic uses strict Zod schema validation (`ImportSchema`) which causes failures when importing older JSON backups or PromptCat exports that do not strictly adhere to the current type definitions.
Error observed: `Batch failed: Invalid import data format.`

## 2. Impacted Components
- `lib/validations.ts`: Defines `ImportSchema`, `ImportItemSchema`.
- `services/imports.ts`: Uses `ImportSchema.safeParse`.
- `docs/functional analysis/Epic_Data_Management.md`: Needs update to reflect supported legacy formats.

## 3. Findings
- **Strict Validation**: The `ImportItemSchema` enforces specific types (e.g., `tags` as string or array of strings, `collections` as array of strings).
- **Legacy Handling**: The service code (`importPromptsService`) *does* have logic to handle legacy formats (e.g., CSV-like tags), but it's never reached if the Zod schema rejects the input first.
- **Solution**: We must relax the Zod schema to allow for "messy" legacy inputs, validating only the absolute essentials (like `title` or `content`), and let the service code handle normalization.

## 4. Proposed Changes
1.  **Relax Schema**: Create a `LegacyImportItemSchema` or modify `ImportItemSchema` to be more permissive (e.g. `z.any()` for tags/collections or `z.union` with looser types).
2.  **Normalization**: Ensure `importPromptsService` continues to normalize these looser inputs securely.

## 5. Verification
- We need to create mock "legacy" JSON files to verify that they now pass validation.
- We will add a new unit test or integration test to `tests/imports.test.ts` (if it exists) or create one.
