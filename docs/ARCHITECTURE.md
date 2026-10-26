# Fleet Management API — Architecture

## Decision summary

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js + TypeScript (strict) | Required by the assessment |
| HTTP framework | Express | Recommended; small and familiar |
| Persistence | In-memory Maps | Allowed; keeps the demo runnable with zero infra |
| Validation | Zod at the HTTP boundary | Consistent schemas; no `any` |
| Tests | Vitest + Supertest | Fast unit/HTTP tests without extra runners |
| Concurrency | Synchronous check-and-set on the event loop | No `await` between occupancy checks and insert; reliable in one Node process without an extra lock primitive |
| Business logs | Structured JSON on stderr via `logBusinessRule` | Audits occupancy/integrity decisions without a metrics stack |
| API docs | OpenAPI 3 + `swagger-ui-express` at `/docs` | Interactive contract aligned with the HTTP API |

## Layering

```text
HTTP (routes + Zod) → Controllers → Services (business rules) → Repositories (memory)
```

- Controllers translate HTTP to service calls and never encode business rules.
- Services enforce uniqueness, existence, date rules, active-usage constraints, and deletion integrity.
- Repositories store and query data only; they do not know about “active usage” rules beyond simple queries exposed for the service.
- `createApp(deps)` receives repositories/services for test isolation.

## Process-local occupancy integrity

Start usage, finish usage, and delete automobile/driver run as **fully synchronous** critical sections (no `await` between check and mutation).

Within start, the service:

1. Verifies automobile and driver exist.
2. Verifies neither has an active usage.
3. Inserts the usage.

On a single Node.js event loop, another request cannot interleave mid-section, so two concurrent HTTP handlers cannot both observe “free” and both insert.

**Limitation:** in-memory storage and this model do **not** protect multiple application instances or multiple OS processes. That would require shared persistence and transactional locking, which are out of scope.

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
