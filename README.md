# Fleet Management API

REST API for managing automobiles, drivers, and automobile usages (fleet occupancy). Built for a technical assessment with Node.js, TypeScript, and Express.

**Persistence is in-memory** (`Map` stores). Restarting the process clears all data. This is a single-process demo API, not a production multi-instance deployment.

Interactive contract: [http://localhost:3000/docs](http://localhost:3000/docs) (Swagger UI) · OpenAPI JSON: `/docs.json`

## Features and business rules

- CRUD for automobiles (plate uniqueness after trim + uppercase) and drivers
- List filters: automobiles by `brand` and/or `color` (case-insensitive, AND); drivers by exact `name` (case-insensitive)
- Start / finish / list automobile usages with nested driver and automobile summaries
- **Occupancy:** an automobile and a driver may each have at most one **active** usage (`endDate === null`)
- Conflict priority when both are busy: `AUTOMOBILE_IN_USE` before `DRIVER_IN_USE`
- Cannot delete an automobile or driver that is referenced by any usage (active or finished)
- Structured business-rule logs on stderr (`rule: true`)

## Tech stack

| Area | Choice |
|---|---|
| Runtime | Node.js 20+, TypeScript (strict) |
| HTTP | Express 5 |
| Validation | Zod at the HTTP boundary |
| Persistence | In-memory `Map` repositories |
| Tests | Vitest + Supertest |
| API docs | OpenAPI 3 + `swagger-ui-express` |

## Prerequisites

- Node.js 20 or newer (`engines.node` in `package.json`)
- npm 10 or newer (comes with current Node distributions)

## Quick start

```bash
git clone https://github.com/rafaeljfec2/vehicle-fleet-api.git
cd vehicle-fleet-api
npm install
cp .env.example .env
npm run dev
```

Default URL: `http://localhost:3000` (`PORT` from the environment or `.env`; existing shell variables override `.env`).

```bash
curl -s http://localhost:3000/health
# {"status":"ok"}
```

### Compiled run

```bash
npm run build
npm start
```

`npm start` runs `node dist/server.js` and requires a prior `npm run build`.

## Tests and quality checks

Automated tests do **not** require a running server (Vitest boots the app in-process):

```bash
npm test
```

```bash
npm run lint
npm run typecheck
npm run build
```

| Script | Description |
|---|---|
| `npm run dev` | API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server (build first) |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

Manual occupancy walkthrough (curl, against `npm run dev`): [docs/MANUAL-TESTING.md](docs/MANUAL-TESTING.md).

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness |
| `POST` | `/automobiles` | Create automobile |
| `GET` | `/automobiles` | List (`?brand` `&color`) |
| `GET` | `/automobiles/:id` | Get by id |
| `PUT` | `/automobiles/:id` | Replace plate, color, brand |
| `DELETE` | `/automobiles/:id` | Delete if no usages |
| `POST` | `/drivers` | Create driver |
| `GET` | `/drivers` | List (`?name`) |
| `GET` | `/drivers/:id` | Get by id |
| `PUT` | `/drivers/:id` | Replace name |
| `DELETE` | `/drivers/:id` | Delete if no usages |
| `POST` | `/usages` | Start usage |
| `POST` | `/usages/:id/finish` | Finish active usage |
| `GET` | `/usages` | List with nested driver/automobile |

Full HTTP contract: [docs/API.md](docs/API.md).

### Request examples

IDs below are placeholders — use values returned by create calls (or the [manual walkthrough](docs/MANUAL-TESTING.md), which extracts them automatically). Plates must be unique in the current process; if `ABC1D23` already exists, pick another plate or restart the API.

```bash
curl -s -X POST http://localhost:3000/automobiles \
  -H 'Content-Type: application/json' \
  -d '{"plate":"ABC1D23","color":"Silver","brand":"Toyota"}'
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plate": "ABC1D23",
  "color": "Silver",
  "brand": "Toyota"
}
```

```bash
curl -s -X POST http://localhost:3000/drivers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva"}'
```

```bash
curl -s -X POST http://localhost:3000/usages \
  -H 'Content-Type: application/json' \
  -d '{
    "automobileId":"<automobile-id>",
    "driverId":"<driver-id>",
    "startDate":"2026-10-26T14:00:00.000Z",
    "reason":"Client visit"
  }'
```

```bash
curl -s -X POST http://localhost:3000/usages/<usage-id>/finish \
  -H 'Content-Type: application/json' \
  -d '{"endDate":"2026-10-26T18:00:00.000Z"}'
```

Dates must be ISO-8601 **with a time component**. `endDate` must be ≥ `startDate`.

### Error codes (summary)

| HTTP | Code | Meaning |
|---|---|---|
| `422` | `VALIDATION_ERROR` | Invalid body/params/query |
| `400` | `MALFORMED_JSON` | Body is not JSON |
| `404` | `NOT_FOUND` | Missing resource or route |
| `409` | `DUPLICATE_PLATE` | Plate already registered |
| `409` | `AUTOMOBILE_IN_USE` / `DRIVER_IN_USE` | Active occupancy conflict |
| `409` | `USAGE_ALREADY_FINISHED` | Finish called twice |
| `409` | `AUTOMOBILE_HAS_USAGES` / `DRIVER_HAS_USAGES` | Delete blocked by history |

Envelope shape and full details: [docs/API.md](docs/API.md).

## Architecture and limitations

```text
HTTP (routes + Zod) → Controllers → Services (business rules) → In-memory repositories
```

| Topic | Behavior |
|---|---|
| Persistence | Process memory only; restart wipes data |
| Occupancy integrity | Synchronous check-and-set (no `await` between check and write) on the Node.js event loop |
| Single process | Concurrent HTTP handlers in **one** process cannot both observe “free” and both insert |
| Multiple instances | **Not** safe: no shared store or distributed lock |
| Out of scope | Auth, database, queues, DI frameworks, multi-service deploy |

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Module layout

```text
src/
  app.ts / server.ts
  composition/container.ts
  modules/automobiles|drivers|usages/
  shared/errors|http|logging
  docs/                 OpenAPI + Swagger mount
docs/                   SPEC, API, TEST-PLAN, ARCHITECTURE, MANUAL-TESTING
tests/unit|integration
```

## Further documentation

| Document | Purpose |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | Acceptance criteria for the assessment |
| [docs/API.md](docs/API.md) | HTTP contract and error envelope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Design decisions and concurrency model |
| [docs/TEST-PLAN.md](docs/TEST-PLAN.md) | Automated test plan |
| [docs/MANUAL-TESTING.md](docs/MANUAL-TESTING.md) | Curl walkthrough for occupancy rules |
