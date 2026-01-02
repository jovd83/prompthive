# Technical Specification: Access Control & Admin System

## 1. Authentication & Authorization
The application uses `next-auth` for authentication.
Authorization is Role-Based (RBAC) stored in the `User` model's `role` field.
* `USER`: Default role. Can manage own resources.
* `ADMIN`: Superuser. Can manage all resources and system settings.

## 2. Admin Promotion Mechanism
To prevent unauthorized privilege escalation, admin promotion is gated by a shared secret code.
* **Storage**: The valid code is stored in a server-side file named `admin.properties` in the project root.
* **Format**: key-value pair `admin.code=XXXXXX`.
* **Validation**: A server action `promoteToAdmin(code)` reads this file and compares the input.

## 3. Resource Ownership Logic
### Prompts & Collections
* **Deletion**:
  * `Service.delete(id, userId)`:
    * Fetch resource.
    * Check `resource.ownerId === userId` OR `user.role === 'ADMIN'`.
    * Use Prisma query options or manual check before deletion.

* **Versioning**:
  * `Service.createVersion(userId, promptId)`:
    * Allowed for any valid `userId`. No ownership check required on the parent prompt.

## 4. Settings Security
* **Frontend**: Hide link in `Sidebar`.
* **Page Level**: In `app/(dashboard)/settings/page.tsx`, check `session.user.role`. If not Admin, redirect or show 403.

## 5. Prompt Locking Mechanism
To prevent accidental edits or enforce ownership boundaries, a prompt creator can "Lock" a prompt.
* **Field**: `Prompt.isLocked` (Boolean, default false).
* **Logic**:
    * **Creator**: Can always edit, DELETE, and Lock/Unlock regardless of `isLocked` state.
    * **Other Users**:
        * If `isLocked = false`: Can edit and create new versions.
        * If `isLocked = true`: Read-only access. Edit, Update, and Save Version actions are denied.
* **Enforcement**:
    * **Frontend**: UI elements (Edit button, inputs) are disabled/hidden.
    * **Backend**: API Routes (`PATCH /api/prompt/[id]`) check `isLocked` state and `userId`. Return 403 if unauthorized.
