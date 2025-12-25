# FA-013: Admin Settings Enhancements

## 1. Introduction
This functional analysis defines the new capabilities for Administrators within the Settings page, specifically focusing on user management and platform security.

## 2. User Stories

### US-01: Disable User Registration
**As an** Administrator
**I want to** disable new user registrations globally
**So that** I can control who has access to the platform (e.g., private instance, maintenance mode).

**Acceptance Criteria:**
*   A toggle "Enable New User Registration" is available in the Admin Settings.
*   Default state is **Enabled** (True).
*   When **Disabled** (False):
    *   The "Register" API endpoint returns an error (403 Forbidden).
    *   The "Register" page shows a message: "Registration is currently disabled by the administrator."
    *   The link to "Register" from Login page is hidden or disabled (optional but good UX).
*   Existing users can still log in.
*   Admins can still add users manually (see US-02).

### US-02: Add New User Manually
**As an** Administrator
**I want to** manually create a new user account
**So that** I can onboard users even when public registration is disabled.

**Acceptance Criteria:**
*   A "Create User" form is available in Admin Settings.
*   Fields: Username, Email, Password.
*   Validation: functionality matches public registration (unique email/username).
*   Upon success, the user is created with role `USER`.

### US-03: Manage User Roles (Admin Rights)
**As an** Administrator
**I want to** grant or revoke Admin rights for existing users
**So that** I can delegate management responsibilities.

**Acceptance Criteria:**
*   A list of users is displayed in Admin Settings.
*   Each user row has a "Role" toggle/dropdown or "Make Admin" button.
*   Admins can promote a `USER` to `ADMIN`.
*   Admins can demote an `ADMIN` to `USER` (ensure at least one admin remains or warn).

## 3. Data Model Changes

### New Model: `GlobalConfiguration`
To store system-wide settings that are not tied to a specific user.

```prisma
model GlobalConfiguration {
  id                 String  @id @default("GLOBAL") // Singleton ID
  registrationEnabled Boolean @default(true)
}
```
*Note: Alternatively, could use a Key-Value store model, but a typed singleton row is safer.*

## 4. Security Considerations
*   Only users with role `ADMIN` can access these settings and api endpoints.
*   User list should not expose sensitive data (password hashes).
