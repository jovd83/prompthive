# Security Hardening Roadmap: PromptHive

**Report Generation Date:** 2026-02-22 17:34  
**Security Posture Score:** **30/100** (Critically Exposed)

---

## Executive Summary
The PromptHive codebase exhibits a "vibe-coded" architecture where functional requirements are prioritized over security boundaries. The system currently lacks fundamental "Zero Trust" protections, including strict ownership checks on modification actions (IDOR) and a secure privilege management system. Most critically, an administrative backdoor exists via a hardcoded properties file, and private content is accessible to any authenticated user who knows the resource ID.

---

## 🛡️ Vulnerability Table

| Location | Severity | Vulnerability | The Exploit | The Fix |
| :--- | :--- | :--- | :--- | :--- |
| `app/(dashboard)/prompts/[id]/page.tsx` | **Critical** | Broken Access Control (IDOR) | Attacker can view any `isPrivate` prompt by guessing the UUID or Technical ID. | Implement `currentUserId` check against `createdById` before rendering. |
| `services/prompt-bulk.ts` / `services/prompt-crud.ts` | **Critical** | Broken Access Control (IDOR) | Users can move, tag, or **overwrite** any other user's prompts if they aren't "locked" (locking is a soft UI state, not a security boundary). | Implement strict `if (prompt.createdById !== userId) throw Error` in all write services. |
| `actions/user.ts` (`promoteToAdmin`) | **Critical** | Hardcoded Admin Backdoor | Anyone with the static code `HIVE25` from `admin.properties` can elevate themselves to `ADMIN`. | Remove file-based privilege escalation; use a proper seeding script or initial admin grant. |
| `app/api/analytics/route.ts` | **Medium** | Unauthenticated API Endpoint | Any external agent can flood the system with fake view/copy analytics, leading to data corruption and potential DB exhaustion. | Wrap route in `getServerSession` auth check. |
| `.env.production` / `admin.properties` | **High** | Secret Leakage | Production secrets (JWT secret, admin codes) are placeholders or hardcoded in the repository. | Extract all secrets to a secure Vault/Secret Manager and use unique random strings. |
| `Dockerfile` / `start.sh` | **Medium** | Over-privileged Context | The application runs as `root` (commented out USER) and uses `chmod 777` on the data directory. | Enforce `USER nextjs` in Dockerfile and use restricted permissions (`755` for dirs, `644` for files). |
| `components/UnifiedPromptForm.tsx` (Line 282) | **Low** | XSS Risk | `dangerouslySetInnerHTML` is used for translation hints. | Use standard React children or a sanitization library like `DOMPurify`. |
| `lib/rate-limit.ts` | **Medium** | Weak Global Rate Limiting | Rate limiting is only applied to one API; authentication and password reset routes are vulnerable to brute force. | Apply `rateLimit` middleware to all sensitive actions and auth callbacks. |

---

## 🛠️ Phase-Specific Breakdown

### I. Injection & Input Sanitization
*   **Status:** Generally safe for SQL (Prisma), but high-risk for XSS.
*   **Observation:** The use of `dangerouslySetInnerHTML` in translation strings is a "smell." While translations are currently internal, this pattern often spreads to user content.
*   **Action:** Immediate audit of all translation usages and replacement with safe rendering.

### II. Authentication & Session Integrity
*   **Status:** Broken.
*   **Observation:** The `promoteToAdmin` function provides a non-revocable, un-logged backdoor. `NEXTAUTH_SECRET` is trivial in the example config.
*   **Action:** Deprecate `admin.properties` immediately. Implement a rotating JWT secret logic.

### III. Data Privacy & Cryptography
*   **Status:** Failed.
*   **Observation:** "Private Prompts" is currently a UI decoration. The backend `findUnique` calls do not filter by owner or privacy status in the main Detail page.
*   **Action:** Update all Prisma queries to include `where: { OR: [{ isPrivate: false }, { createdById: userId }] }`.

### IV. Supply Chain & Environment
*   **Status:** Suboptimal.
*   **Observation:** Next.js version is reported as "16.0.7" in `package.json`, which is potentially a typo or high-risk unstable version. Running as root in Docker is a standard container escape risk.
*   **Action:** Downgrade/Update to a stable Next.js LTS. Switch Docker user to non-privileged.

---

## 🚀 Priority Roadmap (Next 48 Hours)
1.  **Block the Leak:** Update `app/(dashboard)/prompts/[id]/page.tsx` to respect `isPrivate`.
2.  **Close the IDORs:** Patch `prompt-crud.ts` and `prompt-bulk.ts` with ownership checks.
3.  **Seal the Backdoor:** Remove `promoteToAdmin` and delete `admin.properties`.
4.  **Harden Execution:** Update Dockerfile to run as `nextjs` user.
