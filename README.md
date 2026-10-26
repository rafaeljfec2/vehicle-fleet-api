# Fleet Management API

REST API for managing automobiles, drivers, and automobile usages. Built with Node.js, TypeScript, and Express. Persistence is in-memory (no database).

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Quick start (run the API)

```bash
git clone https://github.com/rafaeljfec2/vehicle-fleet-api.git
cd vehicle-fleet-api
npm install
cp .env.example .env
npm run dev
```

The API listens on `http://localhost:3000` by default (`PORT` in `.env` or the shell).

Verify:

```bash
curl -s http://localhost:3000/health
# {"status":"ok"}
```

Interactive docs (Swagger UI): [http://localhost:3000/docs](http://localhost:3000/docs)  
OpenAPI JSON: [http://localhost:3000/docs.json](http://localhost:3000/docs.json)

### Production-like run (compiled)

```bash
npm run build
npm start
```

`npm start` requires a previous `npm run build` (output in `dist/`).

## How to test

### Automated tests

Does **not** need the server running — Vitest boots the app in-process:

```bash
npm test
```

Optional quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

### Manual walkthrough — business rules (recommended)

Business rules under test:

1. An automobile can be used by only one driver at a time.
2. A driver who is already using an automobile cannot use another one at the same time.

**Prerequisites:** in one terminal run `npm run dev`. Keep it open to see business logs (`usage.started`, `usage.rejected.automobile_in_use`, etc.) on stderr. In a second terminal, run the steps below from the project root.

```bash
BASE=http://localhost:3000

# 1) Seed two automobiles and two drivers
AUTO1=$(curl -s -X POST "$BASE/automobiles" \
  -H 'Content-Type: application/json' \
  -d '{"plate":"AAA1A11","color":"Silver","brand":"Toyota"}' \
  | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).id')

AUTO2=$(curl -s -X POST "$BASE/automobiles" \
  -H 'Content-Type: application/json' \
  -d '{"plate":"BBB2B22","color":"Black","brand":"Honda"}' \
  | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).id')

DRV1=$(curl -s -X POST "$BASE/drivers" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva"}' \
  | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).id')

DRV2=$(curl -s -X POST "$BASE/drivers" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bruno Costa"}' \
  | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).id')

echo "AUTO1=$AUTO1"
echo "AUTO2=$AUTO2"
echo "DRV1=$DRV1"
echo "DRV2=$DRV2"

# 2) Start a valid usage (AUTO1 + DRV1) — expect HTTP 201 and endDate null
USAGE=$(curl -s -w '\n%{http_code}' -X POST "$BASE/usages" \
  -H 'Content-Type: application/json' \
  -d "{\"automobileId\":\"$AUTO1\",\"driverId\":\"$DRV1\",\"startDate\":\"2026-10-26T14:00:00.000Z\",\"reason\":\"Client visit\"}")
echo "$USAGE"
USAGE_ID=$(printf '%s' "$USAGE" | sed '$d' | node -pe 'JSON.parse(fs.readFileSync(0,"utf8")).id')

# 3) Same automobile, different driver — expect 409 AUTOMOBILE_IN_USE
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/usages" \
  -H 'Content-Type: application/json' \
  -d "{\"automobileId\":\"$AUTO1\",\"driverId\":\"$DRV2\",\"startDate\":\"2026-10-26T15:00:00.000Z\",\"reason\":\"Should fail: auto busy\"}"

# 4) Same driver, different automobile — expect 409 DRIVER_IN_USE
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/usages" \
  -H 'Content-Type: application/json' \
  -d "{\"automobileId\":\"$AUTO2\",\"driverId\":\"$DRV1\",\"startDate\":\"2026-10-26T15:00:00.000Z\",\"reason\":\"Should fail: driver busy\"}"

# 5) Finish the active usage — expect 200 and endDate set
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/usages/$USAGE_ID/finish" \
  -H 'Content-Type: application/json' \
  -d '{"endDate":"2026-10-26T16:00:00.000Z"}'

# 6) Second finish — expect 409 USAGE_ALREADY_FINISHED
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/usages/$USAGE_ID/finish" \
  -H 'Content-Type: application/json' \
  -d '{"endDate":"2026-10-26T17:00:00.000Z"}'

# 7) After finish, the same pair can start again — expect 201
curl -s -w '\nHTTP %{http_code}\n' -X POST "$BASE/usages" \
  -H 'Content-Type: application/json' \
  -d "{\"automobileId\":\"$AUTO1\",\"driverId\":\"$DRV1\",\"startDate\":\"2026-10-26T17:00:00.000Z\",\"reason\":\"Reuse after finish\"}"

# 8) List history — expect driver name + automobile plate/color/brand embedded
curl -s "$BASE/usages" | node -pe 'JSON.stringify(JSON.parse(fs.readFileSync(0,"utf8")), null, 2)'
```

Expected outcomes summary:

| Step | Expected |
|---|---|
| 2 Start AUTO1+DRV1 | `201`, `endDate: null` |
| 3 AUTO1 + DRV2 | `409` `AUTOMOBILE_IN_USE` |
| 4 AUTO2 + DRV1 | `409` `DRIVER_IN_USE` |
| 5 Finish | `200` with `endDate` |
| 6 Finish again | `409` `USAGE_ALREADY_FINISHED` |
| 7 Start again | `201` |
| 8 List | Items include `driver.name` and `automobile.plate` |

You can run the same flow in Swagger UI at `/docs` (create resources, then try the conflicting `POST /usages` calls).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server (`node dist/server.js`) — run `build` first |
| `npm test` | Run Vitest suite once |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting |

Configuration is read from the process environment. On startup the server also loads an optional local `.env` file (see `.env.example`) for keys that are not already set in the shell. Existing shell variables take precedence over `.env`.

## In-memory persistence

Data lives in process memory (`Map` stores). Restarting the process clears all data. Occupancy check-and-set (start/finish/delete integrity) is fully synchronous — no `await` between check and write — so it is reliable **inside a single Node.js process**. Multiple instances do not share state or locks.

## Module layout

```text
src/
  app.ts / server.ts
  composition/container.ts
  modules/automobiles|drivers|usages/
  shared/errors|http|logging
  docs/          OpenAPI + Swagger mount
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

Replace the ids returned by create calls before starting or finishing a usage.

### Create automobile

```bash
curl -s -X POST http://localhost:3000/automobiles \
  -H 'Content-Type: application/json' \
  -d '{"plate":"ABC1D23","color":"Silver","brand":"Toyota"}'
```

Example response:

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
    "automobileId":"<automobile-id>",
    "driverId":"<driver-id>",
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
- Process-local integrity uses synchronous check-and-set on the Node.js event loop (no mutex library).
- Business-rule outcomes are logged as JSON lines on stderr (`rule: true`), for example `usage.started`, `usage.rejected.automobile_in_use`, `usage.finished`, `automobile.rejected.duplicate_plate`.
- OpenAPI 3 document is served at `/docs` (Swagger UI) and `/docs.json`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
