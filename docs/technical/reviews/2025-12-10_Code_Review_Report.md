# Code Review Report

**Date:** 2025-12-10
**Reviewer:** Senior Principal Engineer (Automated)
**Project:** Prompt Library (Next.js/Prisma/SQLite)

---

### 1. Executive Summary
The application is functional and leverages modern Next.js features (Server Actions, App Router) correctly. However, it suffers from significant "Vibe Coding" symptoms: **God Files** and **mixed concerns**. The architecture is currently "Feature-driven Monolith," where features are grouped by UI proximity rather than logical domain.

**Critical Finding:** `app/actions.ts` is a ~1,300 line dependency magnet. It handles everything from auth, file I/O, database mutations, and complex import logic. This file is a maintenance bottleneck and a merge conflict risk.

---

### 2. Code Smells & Hygiene Audit

| Smell | Severity | Location | Explanation |
| :--- | :--- | :--- | :--- |
| **The God File** | 🔴 Critical | `app/actions.ts` | Contains 15+ completely unrelated domains (Settings, Prompts, Auth, Backups, Imports). Violates SRP (Single Responsibility Principle). |
| **Logic Duplication** | 🟠 High | `CreatePromptForm.tsx` & `EditPromptForm.tsx` | Both components manually reimplement file handling, variable scanning, and dynamic input array logic (300-400 lines each). |
| **Schema "Hack"** | 🟡 Medium | `PromptVersion.variableDefinitions` | Storing structured data as a JSON string works but forfeits database integrity and searchability. |
| **Ghost Logic** | 🟡 Medium | `Sidebar.tsx` | Contains complex tree reconstruction logic. While `computeRecursiveCounts` was extracted (Good!), the sidebar still owns too much view-model logic (sorting, drag-and-drop state). |
| **Hardcoded Constants** | 🟢 Low | `actions.ts` | File extension lists and magic strings like `"ADMIN"` or `"DAILY"` are scattered in the code. |

---

### 3. Refactoring Roadmap

Here is your step-by-step guide to decoupling this architecture without rewriting the whole app.

#### Phase 1: The "Service Layer" Extraction (Highest Impact)
Break `actions.ts` into specialized **Service** files. Server Actions should only be thin wrappers (Controllers) that call these services.

| Current File | New Home | Description |
| :--- | :--- | :--- |
| `app/actions.ts` | `services/prompts.ts` | `createPrompt`, `deletePrompt`, `params` logic. |
| `app/actions.ts` | `services/collections.ts` | `moveCollection`, `deleteCollection` and tree logic. |
| `app/actions.ts` | `services/backup.ts` | `performBackup`, `restoreBackup`, file system ops. |
| `app/actions.ts` | `services/import.ts` | `importPromptCat`, `importPrompts` (complex parsing). |

**Example of the Fix:**
```typescript
// app/actions/prompt-actions.ts (The new "Controller")
'use server'
import { createPromptService } from "@/services/prompts";
import { z } from "zod";

const createPromptSchema = z.object({ ... });

export async function createPromptAction(formData: FormData) {
  // 1. Validation Layer
  const result = createPromptSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return { error: "Validation Failed" };

  // 2. Service Layer (Business Logic)
  try {
    await createPromptService(result.data, formData.getAll('files'));
    return { success: true };
  } catch (e) {
    // 3. Error Handling Layer
    return { error: "Database Error" };
  }
}
```

#### Phase 2: Client Component Slimming
Extract the duplicated logic from your forms into a custom hook.

**The Fix:** Create `hooks/usePromptEditor.ts`
```typescript
// Encapsulate the complex state management
export function usePromptEditor(initialData?: PromptData) {
  const [variables, setVariables] = useState(initialData?.vars || []);
  const [files, setFiles] = useState<File[]>([]);

  // Move the regex scanning logic here
  const scanContentForVariables = (content: string) => { ... }

  return { variables, files, addVariable, scanContentForVariables };
}
```
*Refactoring `CreatePromptForm.tsx` from 350 lines → ~120 lines.*

#### Phase 3: Schema Maturity
The JSON string for variables is a technical debt.

**The Fix:**
1.  Keep the JSON for now if you want flexibility.
2.  **Better:** Create a `PromptVariable` model if you ever plan to filter prompts by "Which prompts use the {{customer_name}} variable?".
```prisma
model PromptVariable {
  id          String @id @default(cuid())
  key         String // e.g., "customer_name"
  description String?
  versionId   String
  version     PromptVersion @relation(fields: [versionId], references: [id])
}
```

---

### 4. Security & Performance (Specific Findings)

*   **N+1 Risk in Tree Building:**
    Currently, you seem to fetch `prisma.collection.findMany` once and build the tree in memory (`computeRecursiveCounts`). **This is actually GOOD**. Do not switch to recursive SQL queries or lazy-loading (fetching children on click) unless you have >5,000 collections. The in-memory build is much faster for typical inputs.

*   **Server Action Security:**
    *   **Auth Check:** Ensure *every* exported Server Action begins with:
        ```typescript
        const session = await getServerSession(authOptions);
        if (!session) throw new Error("Unauthorized");
        ```
    *   **File Upload Validation:** You have client-side extension checking. Ensure `services/prompts.ts` re-validates file magic numbers (signatures) server-side, not just extensions, to prevent malicious `.exe` files renamed to `.png`.

### 5. Final "Clean Code" Verdict
The project is in the **"Adolescent"** phase. It has outgrown its "Prototype" roots. Breaking `actions.ts` into domain services is the **single most important action** you can take to make this codebase "Professional Grade".
