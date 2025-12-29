# TE-009: Visibility Settings Implementation

## 1. Data Model Changes

We will introduce a many-to-many relation between `Settings` and `User` to track hidden users.

### File: `prisma/schema.prisma`

```prisma
model Settings {
  // ... existing fields ...
  hiddenUsers User[] @relation("UserVisibility")
}

model User {
  // ... existing fields ...
  hiddenInSettings Settings[] @relation("UserVisibility")
}
```

## 2. API / Services

### Service: `services/settings.ts`
*   Update `updateSettings` to accept a list of `hiddenUserIds`.
*   It should handle the `connect`/`disconnect` or `set` logic for the relation.
*   Ideally, the frontend sends the list of "Visible IDs" or "Hidden IDs". The requirement implies the user manipulates "visible" checkboxes.
*   Logic:
    *   Form sends: `visibleUserIds`.
    *   Backend logic:
        *   Get All User IDs.
        *   Calculate `hiddenUserIds` = `AllUserIds` - `visibleUserIds`.
        *   Update `Settings` with `hiddenUsers: { set: hiddenUserIds.map(id => ({id})) }`.
    *   *Alternative:* Form sends `hiddenUserIds` directly. The UI knows who is unchecked. This is more direct. I will implement the UI to calculate `hiddenUserIds` (unchecked items) and send that.

### Service: `services/prompts.ts`
*   Update `getAllPrompts` (and search/collection prompt fetchers) to filter out hidden users.
*   Signature: `getAllPrompts(userId: string, ...)`
*   Logic:
    *   Fetch `settings` for `userId` including `hiddenUsers`.
    *   Extract `hiddenIds`.
    *   Add `createdById: { notIn: hiddenIds }` to the Prisma `findMany` query.

### Action: `actions/settings.ts`
*   Define server action `updateVisibilitySettings`.

## 3. UI Components

### Component: `SettingsForm.tsx`
*   Needs to receive:
    *   `allUsers`: List of {id, username, avatarUrl}
    *   `initialHiddenUsers`: List of strings (IDs).
*   State: `checkedUsers` (Set or Array).
*   Render list.
*   On Save, derive `hiddenUsers` (allUsers - checkedUsers) and submit.

## 4. Security
*   Visibility filtering is a user preference, not a strict security ACL, but it should be enforced consistently in the read paths.

## 5. Collection Visibility

### Data Model
*   New relation: `Settings.hiddenCollections` <-> `Collection.hiddenInSettings`.
*   Works similarly to `hiddenUsers`.

### Service Logic
*   `services/settings.ts` needs `updateCollectionVisibilitySettings`.
*   Fetching collections (`services/collections.ts`) should check `Settings.hiddenCollections` for the current user and filter them out (unless specifically requested, e.g. in Settings page).
