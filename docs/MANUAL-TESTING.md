# Manual testing walkthrough

Use this guide to exercise occupancy rules against a running API. Automated coverage lives in `tests/` (`npm test`); this document is for interactive verification.

## Prerequisites

1. From the project root, start the API in one terminal:

```bash
npm run dev
```

2. Prefer a **fresh process** before seeding (in-memory data from earlier runs survives until restart). Restart `npm run dev` if plates below collide with existing data.

3. Keep that terminal visible: business-rule decisions are logged as JSON lines on stderr (`usage.started`, `usage.rejected.automobile_in_use`, etc.).

4. Run the steps below in a **second** terminal from the project root.

## Occupancy rules under test

1. An automobile can be used by only one driver at a time (active usage = `endDate === null`).
2. A driver who already has an active usage cannot start another one.
3. After finish, the same automobile/driver pair can start again.
4. When both are busy, the API returns `AUTOMOBILE_IN_USE` first (deterministic priority).

## Shell helpers

Examples use Node with an explicit `fs` require (compatible with `node -e` / piping stdin):

```bash
BASE=http://localhost:3000

json_id() {
  node -e 'const fs = require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(0, "utf8")).id);'
}

json_pretty() {
  node -e 'const fs = require("fs"); console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, "utf8")), null, 2));'
}
```

Plates are unique per run (max length 10) so a dirty in-memory store does not break the script:

```bash
SUF=$(node -e 'process.stdout.write(Math.random().toString(36).slice(2, 6).toUpperCase())')
```

## Steps

```bash
BASE=http://localhost:3000
json_id() {
  node -e 'const fs = require("fs"); process.stdout.write(JSON.parse(fs.readFileSync(0, "utf8")).id);'
}
json_pretty() {
  node -e 'const fs = require("fs"); console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, "utf8")), null, 2));'
}
SUF=$(node -e 'process.stdout.write(Math.random().toString(36).slice(2, 6).toUpperCase())')

# 1) Seed two automobiles and two drivers
AUTO1=$(curl -s -X POST "$BASE/automobiles" \
  -H 'Content-Type: application/json' \
  -d "{\"plate\":\"AA1${SUF}\",\"color\":\"Silver\",\"brand\":\"Toyota\"}" \
  | json_id)

AUTO2=$(curl -s -X POST "$BASE/automobiles" \
  -H 'Content-Type: application/json' \
  -d "{\"plate\":\"BB2${SUF}\",\"color\":\"Black\",\"brand\":\"Honda\"}" \
  | json_id)

DRV1=$(curl -s -X POST "$BASE/drivers" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Ana Silva ${SUF}\"}" \
  | json_id)

DRV2=$(curl -s -X POST "$BASE/drivers" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Bruno Costa ${SUF}\"}" \
  | json_id)

echo "AUTO1=$AUTO1"
echo "AUTO2=$AUTO2"
echo "DRV1=$DRV1"
echo "DRV2=$DRV2"

# 2) Start a valid usage (AUTO1 + DRV1) — expect HTTP 201 and endDate null
USAGE=$(curl -s -w '\n%{http_code}' -X POST "$BASE/usages" \
  -H 'Content-Type: application/json' \
  -d "{\"automobileId\":\"$AUTO1\",\"driverId\":\"$DRV1\",\"startDate\":\"2026-10-26T14:00:00.000Z\",\"reason\":\"Client visit\"}")
echo "$USAGE"
USAGE_ID=$(printf '%s\n' "$USAGE" | sed '$d' | json_id)

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
curl -s "$BASE/usages" | json_pretty
```

## Expected outcomes

| Step | Expected |
|---|---|
| 2 Start AUTO1+DRV1 | `201`, `endDate: null` |
| 3 AUTO1 + DRV2 | `409` `AUTOMOBILE_IN_USE` |
| 4 AUTO2 + DRV1 | `409` `DRIVER_IN_USE` |
| 5 Finish | `200` with `endDate` |
| 6 Finish again | `409` `USAGE_ALREADY_FINISHED` |
| 7 Start again | `201` |
| 8 List | Items include `driver.name` and `automobile.plate` |

The same flow can be run in Swagger UI at `/docs`.

## Optional: concurrent start

With a free automobile/driver pair, fire two starts in parallel. Exactly one should succeed:

```bash
# AUTO_X and DRV_X must be free (no active usage)
( curl -s -o /tmp/race_a.json -w '%{http_code}' -X POST "$BASE/usages" \
    -H 'Content-Type: application/json' \
    -d "{\"automobileId\":\"$AUTO_X\",\"driverId\":\"$DRV_X\",\"startDate\":\"2026-10-26T18:00:00.000Z\",\"reason\":\"race A\"}" \
    > /tmp/race_a.code ) &
( curl -s -o /tmp/race_b.json -w '%{http_code}' -X POST "$BASE/usages" \
    -H 'Content-Type: application/json' \
    -d "{\"automobileId\":\"$AUTO_X\",\"driverId\":\"$DRV_X\",\"startDate\":\"2026-10-26T18:00:00.000Z\",\"reason\":\"race B\"}" \
    > /tmp/race_b.code ) &
wait
echo "A=$(cat /tmp/race_a.code) B=$(cat /tmp/race_b.code)"
# Expect sorted statuses: 201 and 409
```

Automated equivalent: `tests/integration/usages.test.ts` (`Promise.all` on two `POST /usages`).

## Notes

- Do not use the shell variable name `UID` for the usage id (`UID` is read-only in bash). Use `USAGE_ID`.
- Dates must be ISO-8601 with a time component (e.g. `2026-10-26T14:00:00.000Z`). `endDate` must be greater than or equal to `startDate`.
- This walkthrough assumes a single API process. Multi-instance consistency is out of scope (see [ARCHITECTURE.md](./ARCHITECTURE.md)).
