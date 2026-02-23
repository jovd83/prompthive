# Stress Test & Robustness Roadmap: PromptHive

## System Health Score: 45/100
**Assessment:** The application is highly functional for happy-path user flows but exhibits severe vulnerabilities under load. The architecture heavily relies on pulling massive datasets into node's memory space and blocking the main thread during IO and serialization. Unbounded data exports containing embedded base64 image data present an immediate Out-Of-Memory (OOM) risk. In addition, the synchronous interaction with a local SQLite database during bulk operations (imports) poses a critical concurrency bottleneck ("database is locked" errors). 

## The Bottleneck Table

| Location | Priority | Weakness | Impact | Optimization/Fix |
| :--- | :--- | :--- | :--- | :--- |
| `app/api/export/route.ts` & `services/backup.ts` | **P0** | **Memory Bloat & Eager Loading** | Entire DB of user prompts & base64 images are loaded into RAM simultaneously. Causes OOM crashes and Node event loop stalling. | Refactor to use a streaming JSON response (`JSONStream`) and stream static files directly instead of embedding base64 payloads in memory. |
| `services/backup.ts` | **P0** | **The Blocking Thread** | `readFileSync` is used inside loops (`getFileAsBase64`) for heavy IO. | Blocks the Next.js main thread, freezing all other requests. Switch to asynchronous `fs.promises.readFile`. |
| `actions/scraper.ts` | **P1** | **The "Happy Path" Assumption** | `fetch(url)` has no timeout configuration, circuit breakers, or retry logic. | Malicious/slow URLs will cause suspended un-ending requests, leading to thread/socket exhaustion. Implement `AbortController` timeouts and retries. |
| `services/imports.ts` (`importStructureService`) | **P1** | **Race Conditions** | Try-catch block falling back to `findFirst` then `create` simulates an "upsert" but is not atomic. | Race conditions during concurrent imports lead to duplicate collections or detached structures. Use a robust transaction or true DB unique constraints. |
| `services/imports.ts` (`importPromptsService`) | **P1** | **Resource Contention (DB Locks)** | Looping over arrays to perform hundreds/thousands of sequential `prisma.prompt.create` calls against a SQLite database. | "Database is locked" exceptions under concurrency; blocks concurrent read access. Batch inserts using `prisma.createMany` and leverage transaction chunks. |
| `docker-compose.acceptance.yml` & `package.json` | **P2** | **Single Point of Failure** | Relies on a single local SQLite database file without HA or replication strategy. | App crashes entirely if storage volume has issues; limits horizontal scaling. Consider migrating to PostgreSQL for high-throughput concurrency. |
| `next.config.ts` | **P2** | **Inefficient Serialization Risk** | Next HTTP `bodySizeLimit` set to a massive `200mb`. | Allows malicious or malformed payloads to be fully loaded into memory, creating a massive DDoS/OOM vulnerability. Reduce to <10mb and use multipart/chunked uploads for files. |

## Detailed Breakdown & Roadmap

### I. Latency & Resource Contention
- **The Blocking Thread:** In `services/backup.ts`, the routine `getFileAsBase64` synchronously reads image files off the disk using `readFileSync`. Executing this within an array map over the entire user database guarantees catastrophic event-loop blocking.
- **Memory Bloat:** Embedding images as base64 strings directly in the JSON export payload (`JSON.stringify`) means memory usage will be roughly $O(N) * 1.33$ of the disk size per request. A 100MB database export requires >200MB of resident RAM.

### II. Fault Tolerance & Resilience
- **The "Happy Path" Assumption:** Scraper API assumes external servers respond correctly. If an adversary submits a tarpit URL (connects but sends 1 byte per minute), the Node function will permanently hang.

### III. Data Integrity & Concurrency
- **Race Conditions:** Upserts in Prisma against non-unique fields in `imports.ts` are currently managed via manually catching a failed upsert, checking `findFirst`, and dispatching `create`. Under a heavy swarm of requests, two threads will both fail the initial `upsert`, both see `findFirst` = null, and both attempt to `create`.

### IV. Scalability & Efficiency
- **The "Eager Loader":** The `.findMany` pattern inside the export logic uses `include: { versions: { include: attachments: true } }` globally. When fetching thousands of prompts, Prisma will instantiate thousands of complex JavaScript objects at once.

## Next Steps for the SRE Team
1. **Streaming Migration:** Immediately migrate export/backup endpoints to Node.js `Readable` streams and stop Base64 embedding.
2. **Timeouts:** Patch `fetch` in scraper with `AbortSignal.timeout(5000)`.
3. **Database Concurrency:** Consolidate array-based `create` loops into `createMany` queries and run them inside bounded `prisma.$transaction()` chunks.
