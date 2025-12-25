# Epic: Authentication & Settings
**Entity:** `User`, `Settings`

This epic covers user identity, system configuration, and data management.

## User Stories

### 1. User Registration
**As a** Guest
**I want to** register for an account with a username and email
**So that** I can create and save my own prompts.

**UI/UX Description:**
- **Page:** `/register`
- **Fields:** Username, Email, Password.
- **Validation:** Checks for unique username/email.
- **Design:** Centered card layout. Links to Login if account exists.

---

### 2. User Login
**As a** User
**I want to** log in securely
**So that** I can access my private collections and administrative features.

**UI/UX Description:**
- **Page:** `/login`
- **Fields:** Email, Password.
- **Design:** Clean, centered user interface. Displays theme-aware Application Logo (Light/Dark minimal version) above title.

---

### 3. Theme Toggle (Dark/Light Mode)
**As a** User
**I want to** toggle between dark and light themes
**So that** I can view the application comfortably in different lighting conditions.

**UI/UX Description:**
- **Component:** A toggle switch or Sun/Moon icon in the Sidebar footer.
- **Behavior:** Instantly switches CSS variables for background, surface, and text colors. Persists preference (localStorage or cookie).

---

### 4. Configure Auto-Backup
**As a** User
**I want to** configure automatic backups of my data
**So that** I don't lose my work.

**UI/UX Description:**
- **Page:** `/settings`
- **Settings Form:**
    - **Toggle:** Enable/Disable Auto-Backup.
    - **Path Input:** Absolute local path (e.g., `C:/Backups`).
    - **Frequency Dropdown:** Daily, Weekly, Monthly.
- **Feedback:** Success message upon saving.

- **Feedback:** Success message upon saving.

---

### 5. Manual Import/Export
**As a** User
**I want to** manually import or export prompts (JSON / PromptCat format)
**So that** I can migrate data or share it with others.

**UI/UX Description:**
- **Page:** `/import-export` (Available in sidebar).
- **Tabs:** "Import Prompts" / "Export Prompts".
- **Import:** File picker for JSON file. "Upload" button. Supports `PromptCat` legacy format mapping (uses server-side parsing).
- **Export:** "Download All" button generating a JSON file.

---

### 6. Danger Zone (Drop & Restore)
**As a** User
**I want to** reset my database or restore from a specific backup
**So that** I can recover from errors or start fresh.

**UI/UX Description:**
- **Location:** Bottom of `/settings` page, styled with red borders/warnings (Red "Danger Zone" card).
- **Actions:**
    - **Restore from Latest Backup** (Button, Orange style): Automatically scans the configured backup path for the most recent file and restores it.
    - **Drop All Content** (Button, Red style): Permanently deletes selected user data.
- **Confirmation:** Native browser `confirm()` dialogs ("Are you sure...") to ensure intent.
