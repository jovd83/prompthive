# TE-013: Admin Features Implementation (Updated)

## 1. Architecture Overview
(Previous content regarding GlobalConfiguration remains).

## 2. User Management Architecture

### Actions (`actions/admin.ts`)

#### `getUsers()`
*   **Auth**: Admin only.
*   **Returns**: List of `UserBasic` + `role`, `createdAt`.

#### `createUser(data)`
*   **Auth**: Admin only.
*   **Params**: `username`, `email`, `password`, `role` (optional, default USER).
*   **Logic**:
    *   Check for existing email/username.
    *   Hash password.
    *   `prisma.user.create`.
    *   Send welcome email (fire-and-forget).

#### `updateUserRole(userId, newRole)`
*   **Auth**: Admin only.
*   **Logic**:
    *   `prisma.user.update`.
    *   Prevent demoting self (optional safety).

### Frontend Components

#### `UserManagement.tsx`
*   Client Component.
*   Fetch users on mount or receive as prop initial data.
*   State: `users`, `isAddingUser`.
*   Render table of users.
*   Render "Add User" dialog.
*   Optimistic updates or revalidatePath integration.

#### `AdminSettings.tsx`
*   Consume `UserManagement`.
