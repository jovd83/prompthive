# Performance Test Plan: PromptHive Scalability & Robustness
Date: 2026-04-15
Status: DRAFT

## 1. Objectives
This plan outlines the testing strategy to validate PromptHive's performance under extreme load ("lots of everything"). The primary focus is identifying the breaking point for memory usage (OOM risks) and database concurrency (SQLite locking) as identified in previous audits.

## 2. Test Scenarios

### SC-01: User Scale (Concurrency)
* **Goal:** Validate handling of 10,000+ registered users with 500 concurrent sessions.
* **Volume:**
    - 10,000 User records in DB.
    - 500 Virtual Users (VUs) logged in.
* **Key Operations:**
    - Session handshake / JWT validation.
    - Fetching dashboard (user-specific prompts/collections).
* **Success Criteria:** 95th percentile response time < 800ms for dashboard loading.

### SC-02: Prompt & Collection Volume (Deep Nesting)
* **Goal:** Validate UI responsiveness and API efficiency with massive hierarchical data.
* **Volume:**
    - 100,000 Prompts total.
    - 5,000 Collections.
    - 10 tiers of collection nesting.
* **Key Operations:**
    - Root-level collection retrieval.
    - Recursive tag selection in `TagSelector.tsx`.
    - Sidebar collection expansion.
* **Success Criteria:** Sidebar rendering completes in < 1.0s.

### SC-03: Stress Testing (Bulk Export/Backup)
* **Goal:** Trigger potential Out-Of-Memory (OOM) conditions identified in P0 audit findings.
* **Volume:**
    - Trigger full system export of 50,000 prompts with attachments.
* **Key Operations:**
    - `POST /api/export`
    - Base64 encoding of large blobs.
* **Success Criteria:** Node process memory stable < 1.5GB; no "Process out of memory" crashes.

### SC-04: Large Attachment Spike (Boundary Test)
* **Goal:** Test `next.config.ts` body limit and IO blocking.
* **Volume:**
    - Simultaneous upload of 50 x 20MB attachments.
* **Key Operations:**
    - Multipart file upload.
    - `getFileAsBase64` blocking check.
* **Success Criteria:** Main event loop delay < 100ms during peak upload.

## 6. Phase Status

### Phase 2: Data Generation (Calibration Set)
- **Status**: COMPLETED (Calibration Volume)
- **Data Volumes**:
  - Users: 100
  - Collections: 500 (Hierarchical)
  - Prompts: 5,000
  - Prompt Versions: 10,020 (including >50KB large prompts)
  - Attachments: 4,437 (Metadata + mock paths)
- **Issues Found**:
  - `prod.db` was out of sync with `schema.prisma` (missing columns: `color`, `isLocked`, `isPrivate`, etc.).
  - Resolved by `prisma db push --force-reset` on `prod.db.test.bak`.
  - Junction tables (`_CollectionToPrompt`) require careful handling in batch imports.

### Phase 3: Stress Testing & Streaming Optimization
- **Active Discovery**: The current export endpoint (`app/api/export/route.ts`) uses an `async*` generator but PRE-LOADS the entire prompt array via `prisma.findMany`.
- **Planned Refactor**:
  1. Implement Cursor-based batching (e.g., slices of 100 prompts) within the stream.
  2. Implement stream-safe base64 encoding or remove heavy embedding from the main flow.
  3. Validate against the 5,000 prompt calibration set.

### Phase 4: SQLite Resilience & Concurrent Auditing
- **Focus**: `prisma.create` loops in `backup.ts` and `imports.ts`.
- **Target**: Migration to bounded `prisma.createMany` calls within transactions.
- **Load Testing**: Simulating 50+ concurrent export requests against a 1GB SQLite database.

---
**Approval Required:**
- [ ] Approve target volumes (10k Users / 100k Prompts)
- [ ] Approve use of `prod.db.test.bak` for destructive testing
