# TE-013: Admin Features Implementation (Updated)

## 1. Architecture Overview
### Global Configuration
*   **Model**: `GlobalConfiguration` (Singleton, ID="GLOBAL").
*   **Fields**:
    *   `registrationEnabled`: Boolean. Controls new sign-ups.
    *   `privatePromptsEnabled`: Boolean. Controls availability of "Private Prompt" checkbox.

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

### Frontend Implementation

#### User Management Section
*   **Path**: `components/settings/UserManagement.tsx` (Embedded in `AdminSettings.tsx`, accessible via `/settings`).
*   **Features**:
    *   List all users with roles.
    *   "Add User" modal (Username, Email, Password, Role).
    *   Role selection includes `USER`, `ADMIN`, `GUEST`.
*   **Security**:
    *   Server Actions (`createUser`, `updateUserRole`, `getUsers`) enforce `ADMIN` role check.
    *   Frontend checks `user.role === 'ADMIN'` before rendering management UI.

