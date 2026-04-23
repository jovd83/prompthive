### Change Request: Move Backup/Danger Zone to Import/Export

#### 🔍 Impact Analysis
- **Impacted epics/stories**:
    - `Epic_Auth_And_Settings.md`: Removed Backup/Danger Zone references.
    - `Epic_Data_Management.md`: Added Backup/Danger Zone references.
- **Unchanged assumptions**: Admin role requirement for these features remains unchanged.
- **Deprecated or altered behavior**: Users can longer find these settings in `/settings`. They must go to `/import-export`.

#### 📘 Updated Functional Analysis (`docs/functional analysis/`)
- **What changed**: Moved "Auto-backup" and "Danger Zone" user stories from Settings to Data Management.
- **Why it changed**: To centralize data-related operations (Import, Export, Backup, Restore) in one location.
- **What stayed the same**: The actual logic and permissions for these operations.

#### 🎨 Wireframes / UX (`docs/wireframes/`)
- **Justification for no change**: No wireframes were present in the context, and the change is a simple relocation of existing UI blocks.

#### 🧠 Technical Documentation & Diagrams
- **Updated docs**: `docs/technical/CR_Move_Settings_To_ImportExport.md` (Self).
- **Summary of technical impact**:
    - `import-export/page.tsx` now fetches `settings` and checks `isAdmin`.
    - `ImportExportContent.tsx` conditionally renders `BackupSettings` and `DangerZoneSettings`.
    - `SettingsForm.tsx` no longer renders these components.
    - `tagColorsEnabled` property patch added to `import-export/page.tsx` to satisfy `Settings` type definition mismatch with Prisma schema.

#### 💻 Code Changes
```tsx
// app/(dashboard)/import-export/page.tsx
// Fetch settings
const settings = await prisma.settings.findUnique({...});
// Pass to component
<ImportExportContent initialSettings={settings} isAdmin={isAdmin} ... />

// components/ImportExportContent.tsx
{isAdmin && initialSettings && (
    <>
        <BackupSettings initialSettings={initialSettings} />
        <DangerZoneSettings />
    </>
)}
```

#### ✅ Unit Tests & Coverage
- **Why existing tests failed**: `settings.spec.ts` was checking for buttons on `/settings` page.
- **New/updated tests**: Updated `frontend-tests/settings.spec.ts` to navigate to `/import-export` and verify presence and functionality of Backup settings there.
- **Coverage**: Maintained existing coverage, ensured regression testing for the moved feature.

#### 🌐 Playwright Tests (`frontend-tests/`)
- **Updated scenarios**:
    - `settings.spec.ts`: Renamed test description, target URL changed to `/import-export`.

#### 📄 User Documentation
- **Updated help/manual content**: N/A (Internal tool, intuitive change).

#### 📘 README.md
- **Summary of changes**: None required.
