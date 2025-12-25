# Epic: Admin Features & Role-Based Access Control

## 1. Introduction
This feature introduces a distinction between regular users and administrators. While regular users can managing their own content, administrators have defined capabilities to manage the entire platform's content and configuration.

## 2. User Stories

### US-01: Admin Promotion
**As a** User
**I want to** be able to promote myself to an Admin status from my profile
**So that** I can access advanced features
**Acceptance Criteria:**
* User profile contains a checkbox "Admin Access".
* Checking the box prompts for a 6-character code.
* The system validates this code against a stored secret in `admin.properties`.
* If correct, the user's role updates to `ADMIN`.
* A success message is shown.
* If incorrect, a refusal message is displayed, and the box remains unchecked.

### US-02: Prompt Deletion Rules
**As a** User
**I want to** delete my own prompts
**So that** I can clean up my library
**Acceptance Criteria:**
* Users can delete prompts they created.
* Users **cannot** delete prompts created by others.
* Administrators can delete **any** prompt, regardless of the creator.

### US-03: Collection Deletion Rules
**As a** User
**I want to** delete my own collections
**So that** I can organize my folder structure
**Acceptance Criteria:**
* Users can delete collections they own.
* Users **cannot** delete collections owned by others.
* Administrators can delete **any** collection.

### US-04: Universal Versioning
**As a** User
**I want to** add new versions to any prompt
**So that** I can improve upon prompts created by others
**Acceptance Criteria:**
* Any authenticated user can create a new version for any existing prompt, even if they are not the prompt owner.

### US-05: Secured Settings Access
**As an** Admin
**I want to** access the global Settings page
**So that** I can configure system-wide backups and maintenance
**Acceptance Criteria:**
* The "Settings" link in the sidebar is visible **only** to Admins.
* Accessing the `/settings` route directly redirects non-admin users to the dashboard.

## 3. Data Model Changes
* No schema changes required if `role` field already exists on `User`.
* `admin.properties` file introduced for secret storage.
