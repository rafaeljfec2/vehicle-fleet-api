# Fleet Management API

REST API for managing automobiles, drivers, and automobile usages. Built with Node.js, TypeScript, and Express. Persistence is in-memory (no database).

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Install

```bash
npm install
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server (`node dist/server.js`) |
| `npm test` | Run Vitest suite once |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting |

Default port: `3000`. Configuration is read from the process environment. On startup the server also loads an optional local `.env` file (see `.env.example`) for keys that are not already set in the shell.

```bash
cp .env.example .env
npm run dev
# or
PORT=3000 npm start
```


Health check: `GET http://localhost:3000/health`

## In-memory persistence

Data lives in process memory (`Map` stores). Restarting the process clears all data. Concurrent integrity for start/finish/delete is guaranteed **only inside a single Node.js process** via an async mutex. Multiple instances do not share state or locks.

## Module layout

```text
src/
  app.ts / server.ts
  composition/container.ts
  modules/automobiles|drivers|usages/
  shared/errors|http|concurrency|logging
docs/
  SPEC.md API.md TEST-PLAN.md ARCHITECTURE.md
tests/unit tests/integration
```

Layers: HTTP (routes + Zod) → controllers → services (business rules) → in-memory repositories.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness |
| `POST` | `/automobiles` | Create automobile |
| `GET` | `/automobiles` | List (`?brand` `&color`, case-insensitive, AND) |
| `GET` | `/automobiles/:id` | Get by id |
| `PUT` | `/automobiles/:id` | Replace plate, color, brand |
| `DELETE` | `/automobiles/:id` | Delete if no usages |
| `POST` | `/drivers` | Create driver |
| `GET` | `/drivers` | List (`?name`, case-insensitive exact) |
| `GET` | `/drivers/:id` | Get by id |
| `PUT` | `/drivers/:id` | Replace name |
| `DELETE` | `/drivers/:id` | Delete if no usages |
| `POST` | `/usages` | Start usage |
| `POST` | `/usages/:id/finish` | Finish active usage |
| `GET` | `/usages` | List usages with nested driver/automobile |

Full contract: [docs/API.md](docs/API.md). Acceptance criteria: [docs/SPEC.md](docs/SPEC.md).

## Request examples

### Create automobile

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

### Create driver

```bash
curl -s -X POST http://localhost:3000/drivers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva"}'
```

### Start usage

```bash
curl -s -X POST http://localhost:3000/usages \
  -H 'Content-Type: application/json' \
  -d '{
    "automobileId":"550e8400-e29b-41d4-a716-446655440000",
    "driverId":"660e8400-e29b-41d4-a716-446655440001",
    "startDate":"2026-10-26T14:00:00.000Z",
    "reason":"Client visit"
  }'
```

### Finish usage

```bash
curl -s -X POST http://localhost:3000/usages/<usage-id>/finish \
  -H 'Content-Type: application/json' \
  -d '{"endDate":"2026-10-26T18:00:00.000Z"}'
```

## Error examples

Validation (`422`):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "plate", "message": "Required" }]
  }
}
```

Automobile already in use (`409`):

```json
{
  "error": {
    "code": "AUTOMOBILE_IN_USE",
    "message": "Automobile already has an active usage"
  }
}
```

Driver already in use (`409`): `DRIVER_IN_USE`  
Duplicate plate (`409`): `DUPLICATE_PLATE`  
Already finished (`409`): `USAGE_ALREADY_FINISHED`  
Delete with history (`409`): `AUTOMOBILE_HAS_USAGES` / `DRIVER_HAS_USAGES`  
Not found (`404`): `NOT_FOUND`  
Malformed JSON (`400`): `MALFORMED_JSON`

## Architecture decisions

- Express + Zod + Vitest; no database, auth, queues, or DI frameworks.
- Business rules live in services; repositories only store/query.
- Active usage = `endDate === null`.
- Plate uniqueness after trim + uppercase.
- Deleting an automobile or driver referenced by any usage returns `409`.
- Process-local `AsyncMutex` serializes start, finish, and deletes that touch usage integrity.
- Business-rule outcomes are logged as JSON lines on stderr (`rule: true`), for example `usage.started`, `usage.rejected.automobile_in_use`, `usage.finished`, `automobile.rejected.duplicate_plate`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Publish checklist (manual)

This repository is not published automatically. Suggested steps:

1. Review `docs/` and this README.
2. Run `npm install && npm run lint && npm test && npm run build`.
3. Confirm `.gitignore` excludes `node_modules/`, `dist/`, `coverage/`, and `.env`.
4. Create the first commit and push to your public Git remote.
