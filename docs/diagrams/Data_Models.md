---
title: Data Models & Schema Dictionary
version: 1.1.0
last_updated: 2025-12-15
author: AI Agent
---

# 🗄️ Data Models & Schema Dictionary

This document serves as the dictionary for the PromptHive local database (SQLite). It matches the definition in `prisma/schema.prisma`.

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Prompt : has
    User ||--o{ Collection : owns
    User ||--o| Settings : has
    User ||--o{ Workflow : owns
    User ||--o{ Favorite : "favorites"
    
    User {
        string id PK
        string username
        string email
        string passwordHash
        string role "USER | ADMIN"
        string language
        string avatarUrl
        string resetToken
        datetime resetTokenExpires
        datetime createdAt
    }

    Settings {
        string id PK
        boolean autoBackupEnabled
        string backupFrequency
        boolean showPrompterTips
        boolean tagColorsEnabled
        boolean workflowVisible
        string backupPath
        datetime lastBackupAt
    }
    
    Prompt ||--|{ PromptVersion : contains
    Prompt }|--|{ Collection : "belongs to"
    Prompt }|--|{ Tag : "tagged with"
    Prompt ||--o{ WorkflowStep : "used in"
    Prompt ||--o{ Favorite : "favorited by"
    Prompt }|--|{ Prompt : "related to"

    Prompt {
        string id PK
        string title
        string description
        string resource
        string currentVersionId FK
        string createdById FK
        int viewCount
        int copyCount
        boolean isLocked
        string technicalId "Unique VIBE-ID"
        datetime createdAt
    }

    PromptVersion {
        string id PK
        string content
        string shortContent
        string usageExample
        string variableDefinitions "JSON"
        string model
        string resultImage
        string resultText
        int versionNumber
        string changelog
        string createdById FK
        datetime createdAt
    }

    Collection ||--o{ Collection : "parent of"
    Collection {
        string id PK
        string title
        string description
        string parentId FK
        string ownerId FK
    }

    Tag {
        string id PK
        string name
        string color
    }
```

## Model Definitions

### 1. User
Represents a registered user of the system.
*   **Fields**: `id`, `username`, `email`, `passwordHash`, `role`, `language`, `avatarUrl`, `resetToken`, `resetTokenExpires`.
*   **Purpose**: Authentication, profile management, and ownership.

### 2. Prompt & PromptVersion
*   **Prompt**: The central entity. Container for metadata (`title`, `description`, `resource`, `collections`, `tags`).
    *   **New Fields**: `technicalId` (Human-readable ID), `isLocked` (Creator lock).
    *   **Relations**: Contains `relatedPrompts` (Many-to-Many self-relation) to allow linking prompts together.
*   **PromptVersion**: Immutable snapshot of the prompt content.
    *   `content`: The main prompt text.
    *   `shortContent`: Optional concise version.
    *   `variableDefinitions`: JSON string defining inputs.
    *   `changelog`: User notes on what changed.
    *   `attachments`: Related files/images.

### 3. Collection
Folders for organization.
*   **Fields**: `id`, `title`, `description`, `parentId`, `ownerId`.
*   **Behavior**: Hierarchical (Adjacency List). Items can be hidden via Settings.

### 4. Tag
*   **Fields**: `id`, `name`, `color`.
*   **Behavior**: Global tags with optional color customization (hex code).

### 5. Settings
*   **Fields**: `id`, `userId`, `autoBackupEnabled`, `backupPath`, `backupFrequency`, `lastBackupAt`, `showPrompterTips`, `tagColorsEnabled`, `workflowVisible`.
*   **Relations**: `hiddenUsers`, `hiddenCollections` (Many-to-Many visibility toggles).
*   **Purpose**: Stores user-specific configuration, preferences, and admin backup settings.
