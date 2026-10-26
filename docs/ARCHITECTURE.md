# Fleet Management API — Architecture

## Decision summary

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js + TypeScript (strict) | Required by the assessment |
| HTTP framework | Express | Recommended; small and familiar |
| Persistence | In-memory Maps | Allowed; keeps the demo runnable with zero infra |
| Validation | Zod at the HTTP boundary | Consistent schemas; no `any` |
| Tests | Vitest + Supertest | Fast unit/HTTP tests without extra runners |
| Concurrency | Single process `AsyncMutex` | Prevents interleaved start/finish/delete in one process |
| Business logs | Structured JSON on stderr via `logBusinessRule` | Audits occupancy/integrity decisions without a metrics stack |

## Layering

```text
HTTP (routes + Zod) → Controllers → Services (business rules) → Repositories (memory)
```

- Controllers translate HTTP to service calls and never encode business rules.
- Services enforce uniqueness, existence, date rules, active-usage constraints, and deletion integrity.
- Repositories store and query data only; they do not know about “active usage” rules beyond simple queries exposed for the service.
- `createApp(deps)` receives repositories/services for test isolation.

## Process-local mutual exclusion

Start usage, finish usage, and delete automobile/driver run inside one shared `AsyncMutex` (promise queue).

Within the start critical section the service:

1. Verifies automobile and driver exist.
2. Verifies neither has an active usage.
3. Inserts the usage.

This prevents two concurrent requests in the **same Node.js process** from both observing “free” and both inserting.

**Limitation:** in-memory storage and this mutex do **not** protect multiple application instances or multiple OS processes. That would require shared persistence and transactional locking, which are out of scope.

## Conflict priority

When both automobile and driver are busy at start time, the service returns `AUTOMOBILE_IN_USE` first (deterministic, documented).

## Directory layout

```text
src/
  server.ts                 # process entry
  app.ts                    # createApp()
  config/env.ts
  shared/
    errors/app-error.ts
    http/error-handler.ts
    http/async-handler.ts
    http/validate.ts
    concurrency/async-mutex.ts
    logging/logger.ts
  modules/
    automobiles/
    drivers/
    usages/
  composition/container.ts
tests/unit
tests/integration
docs/
```

## Non-goals

No authentication, database, message bus, ORM, dependency-injection container library, or multi-service deployment.
