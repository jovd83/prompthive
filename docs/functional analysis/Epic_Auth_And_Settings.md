---
title: Epic_Auth_And_Settings
version: 2.1
last_updated: 2026-01-10
status: Live
---

# Epic: Authentication & Settings

## User Story: User Registration
**As a** Guest
**I want to** create a new account
**So that** I can access the platform features.

### 1. Description
Users can sign up for a new account using a username, email, and password. The system checks if registration is globally enabled by an administrator.

### 2. Technical Scope & Fields
*Derived from Code (app/(auth)/register/page.tsx)*

*   **Username**: Text - Required. Unique.
*   **Email**: Email - Required. Unique.
*   **Password**: Password - Required.
*   **Submit Button**: "Create Account" (or "Submit" per code).

### 3. Acceptance Criteria (AC)
*Derived from Zod Schemas & Logic:*

*   [ ] Verify that `username` and `email` uniqueness is checked against the database.
*   [ ] Verify error "Email already registered" if email exists.
*   [ ] Verify error "Username already taken" if username exists.
*   [ ] Verify that if `GlobalConfiguration.registrationEnabled` is false, error "Registration is currently disabled by the administrator" is shown.
*   [ ] Verify redirection to `/login?registered=true` on success.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/auth_wireframes.png`

**[MISSING IMAGE PLACEHOLDER]**
*If the image above does not exist, create it in Nano Banana Pro with these requirements:*
*   **Layout:** Centered Card.
*   **Key Elements:** Inputs for Username, Email, Password. Link to Login.
*   **State:** Default view.

---

## User Story: User Login
**As a** Registered User
**I want to** log in with my credentials
**So that** I can access my dashboard.

### 1. Description
Users authenticate using their username and password.

### 2. Technical Scope & Fields
*Derived from Code (app/(auth)/login/page.tsx)*

*   **Username**: Text - Required.
*   **Password**: Password - Required.
*   **Forgot Password Link**: Link to `/forgot-password`.
*   **Register Link**: Link to `/register`.

### 3. Acceptance Criteria (AC)
*Derived from Zod Schemas & Logic:*

*   [ ] Verify that invalid credentials return "Invalid credentials" error.
*   [ ] Verify successful login redirects to `/`.
*   [ ] Verify "Account created successfully" message if `?registered=true` is present.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/auth_wireframes.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Centered Card with Logo.
*   **Key Elements:** Username, Password inputs. "Sign In" button.
*   **State:** Default.

---

## User Story: General Settings
**As a** User
**I want to** configure my personal experience
**So that** the app behaves according to my preferences.

### 1. Description
Users can toggle daily prompting tips and change the application language.

### 2. Technical Scope & Fields
*Derived from Code (components/settings/GeneralSettings.tsx, SettingsForm.tsx)*

*   **Show Prompting Tips**: Checkbox/Toggle - Default: True.
*   **Language**: Dropdown/Selector - Options: English (en), Dutch (nl), French (fr).

### 3. Acceptance Criteria (AC)
*   [ ] Verify that toggling "Show Prompting Tips" updates `Settings.showPrompterTips`.
*   [ ] Verify that changing language updates the UI immediately.

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/settings_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Settings Layout > General Tab.
*   **Key Elements:** "Show Prompting Tips" toggle with description. "Language" selector.

---

## User Story: Tag Color Preferences
**As a** User
**I want to** See tags with distinct colors or a uniform color
**So that** I can organize my prompts visually or keep a clean look.

### 1. Description
Users can choose between a colorful palette for tags (where each tag has a distinct color) or a uniform color for all tags (cleaner look).

### 2. Technical Scope & Fields
*Derived from Code (components/settings/GeneralSettings.tsx, TagSelector.tsx)*

*   **Tag Colors Enabled**: Checkbox/Toggle - Default: True.
*   **Tag Color**: String (Hex) - Stored on Tag entity.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that toggling "Enable Tag Colors" updates `Settings.tagColorsEnabled`.
*   [ ] Verify that when enabled, tags display their assigned color.
*   [ ] Verify that when disabled, tags display the default system color.
*   [ ] Verify that new tags get a color assigned (either automatically or manually).

## User Story: Workflow Visibility
**As a** User
**I want to** show or hide workflows
**So that** I can simplify my interface if I don't use them.

### 1. Description
Users can toggle the visibility of the "Workflows" section in the application. By default, this is disabled (hidden) to keep the interface simple.

### 2. Technical Scope & Fields
*Derived from Code (components/settings/GeneralSettings.tsx, Sidebar.tsx)*

*   **Show Workflows**: Checkbox/Toggle - Default: False.
*   **Sidebar Link**: "Workflows" item.

### 3. Acceptance Criteria (AC)
*   [ ] Verify that the default state is unchecked (Workflows hidden).
*   [ ] Verify that checking the box updates `Settings.workflowVisible`.
*   [ ] Verify that checking the box makes the "Workflows" link appear in the sidebar immediately.
*   [ ] Verify that unchecking the box removes the link.


## User Story: User Visibility
**As a** User
**I want to** hide specific users
**So that** their content does not clutter my view.

### 1. Description
Users can select other users to "hide" from their view.

### 2. Technical Scope & Fields
*Derived from Code (components/settings/UserVisibilitySettings.tsx)*

*   **Select User to Hide**: Combobox/Dropdown - Lists all users.
*   **Hidden Users List**: List - Displays currently hidden users with "Unhide" action.

### 3. Acceptance Criteria (AC)
*   [ ] Verify adding a user to the hidden list updates the `UserVisibility` relation.
*   [ ] Verify that hidden users do not appear in relevant lists (scope dependent).

---

---

## User Story: Collapsible Sidebar System Menu
**As a** User
**I want to** collapse the system menu items (Settings, Help, etc.)
**So that** I have more screen space and a cleaner interface, while keeping my profile accessible.

### 1. Description
The sidebar's "System" section (Settings, Help, Import/Export, Theme Toggle, Search) can be collapsed or expanded. The User Profile (Avatar/Name) remains permanently visible at the bottom of the sidebar.

### 2. Technical Scope & Fields
*Derived from Code (components/Sidebar.tsx)*

*   **System Menu Header**: Toggle Control - "SYSTEM" (or "MENU").
*   **Collapsible Items**:
    *   Settings Link
    *   Help Link
    *   Import/Export Link
    *   Theme Toggle
    *   Search Command Trigger
*   **Fixed Footer**:
    *   User Profile Button

### 3. Acceptance Criteria (AC)
*   [ ] Verify that clicking the "System" header toggles the visibility of the menu items.
*   [ ] Verify that the User Profile button remains visible and functional regardless of the system menu state.
*   [ ] Verify that the state (expanded/collapsed) is consistent during the session.

---

## User Story: Admin Management (Global & Users)
**As an** Administrator
**I want to** manage global settings and users
**So that** I can control access and maintenance.

### 1. Description
Admins can enable/disable registration, manage backups, and manage user accounts (list, add, role toggle).

### 2. Technical Scope & Fields
*Derived from Code (components/settings/AdminSettings.tsx, UserManagement.tsx, BackupSettings.tsx)*

*   **Enable User Registration**: Toggle - Controls `GlobalConfiguration.registrationEnabled`.
*   **Enable Private Prompts**: Toggle - Controls `GlobalConfiguration.privatePromptsEnabled`.
*   **User Management Table**:
    *   Columns: User, Role, Actions.
    *   **Role Toggle**: Button - Switches between ADMIN and USER.
    *   **Add User Modal**:
    *   **Username**: Text - Required.
    *   **Email**: Email - Required.
    *   **Password**: Password - Required.
    *   **Role**: Dropdown - Options: USER, ADMIN, GUEST.
    *   **Delete User**:
    *   **Delete Button**: Icon (Trash)
    *   **Confirmation**: Dialog - "Are you sure you want to delete this user?".

### 3. Acceptance Criteria (AC)
*   [ ] Verify disabling registration prevents new sign-ups.
*   [ ] Verify toggling "Enable Private Prompts" updates the database value.
*   [ ] Verify that disabling "Private Prompts" shows a confirmation dialog: "Are you sure? This will hide all private prompts...".
*   [ ] Verify that when disabled, the option to create/edit private prompts is hidden in the UI.
*   [ ] Verify "Add User" creates a user entry in the table immediately.
*   [ ] Verify toggling role updates the user's permission level.
*   [ ] Verify clicking "Delete" opens a confirmation dialog.
*   [ ] Verify confirming delete removes the user from the database and UI.
*   [ ] Verify Admin cannot delete themselves (optional but recommended safety).

### 4. UI Wireframe Specification
**Image Source:** `../wireframes/previews/settings_wireframe.png`

**[MISSING IMAGE PLACEHOLDER]**
*   **Layout:** Settings Layout > Admin Section (Collapsible).
*   **Key Elements**: Registration Toggle (Red styling). Private Prompts Toggle (Blue styling). User Table with Role Toggle buttons and Delete (Trash) buttons. "Add User" (+ Icon) button.

---

## User Story: Private Prompt Visibility
**As a** User
**I want to** Create and View Private Prompts
**So that** I can keep drafts or personal prompts secret.

### 1. Description
Users can mark prompts as "Private". These are only visible to the creator. However, this feature is dependent on the Global Admin Setting "Enable Private Prompts".

### 2. Technical Scope & Fields
*Derived from Code (components/UnifiedPromptForm.tsx, PromptDetail.tsx)*

*   **Private Prompt Checkbox**: Visible only if `GlobalConfiguration.privatePromptsEnabled` is TRUE.
*   **Make Private/Public Toggle (Eye Icon)**: Visible only if `GlobalConfiguration.privatePromptsEnabled` is TRUE.

### 3. Acceptance Criteria (AC)
*   [ ] Verify "Private Prompt" checkbox is hidden during creation/editing if global setting is disabled.
*   [ ] Verify "Eye Icon" (Make Private/Public) is hidden on prompt detail page if global setting is disabled.
*   [ ] Verify existing private prompts are NOT accessible/visible if global setting is disabled (Optional: or just hidden from lists).
