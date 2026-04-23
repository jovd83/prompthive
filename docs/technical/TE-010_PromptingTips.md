# TE-010: Prompting Tip of the Day Technical Spec

## Overview
This document outlines the technical implementation of the "Prompting Tip of the Day" feature. This feature provides users with daily prompting tips on the dashboard, with the ability to toggle visibility via user settings.

## Architecture

### Backend
- **Database**:
  - `Settings` model updated to include `showPrompterTips` (Boolean, default: true).
- **API/Actions**:
  - `saveVisibilitySettings` (or new action) to handle the new field.

### Frontend
- **Components**:
  - `TipOfTheDay.tsx`: A new client component that renders the tip.
    - **Props**: `tip: { title, short, long, resource_text, resource_url }`, `isVisible: boolean`.
    - **State**: `expanded` (boolean) to toggle full details.
  - `DashboardContent.tsx`: Modified to include `TipOfTheDay` conditionally based on user settings.
  - `SettingsForm.tsx`: Modified to include the toggle for this setting.
- **Data Source**:
  - `prompting_tips/prompt_tips.json`: JSON file acting as the tip database.

### Logic
1.  **Tip Selection**:
    - Ideally, deterministic based on date hash (`currentDate % totalTips`) to ensure "Tip of the Day" consistency for all users, or random if preferred for variety on refresh.
    - *Decision*: Random on mount for MVP to ensure users see different tips if they navigate frequently.

2.  **User Preference**:
    - Persisted in `Settings` table.
    - Fetched alongside user data on Dashboard load.

## Security
- No new security implications. Setting is restricted to the authenticated user.

## Migration
- `prisma migrate dev`: Add `showPrompterTips` column.
