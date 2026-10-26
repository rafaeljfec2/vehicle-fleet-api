# Fleet Management API — HTTP Contract

Base URL: `http://localhost:3000` (default). No API prefix.

All request and response bodies use JSON. Field names are English.

## Error envelope

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human-readable summary",
    "details": [
      { "field": "plate", "message": "Required" }
    ]
  }
}
```

`details` is present only for validation errors.

### Status codes

| Status | When |
|---|---|
| `200` | Successful read or update |
| `201` | Successful create; `Location` header set |
| `204` | Successful delete (empty body) |
| `400` | Malformed JSON |
| `404` | Unknown route or resource id not found |
| `409` | Business conflict |
| `422` | Validation failure (including malformed UUID) |
| `500` | Unexpected server error |

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Invalid input |
| `MALFORMED_JSON` | 400 | Body is not valid JSON |
| `NOT_FOUND` | 404 | Resource or route not found |
| `DUPLICATE_PLATE` | 409 | Plate already registered |
| `AUTOMOBILE_IN_USE` | 409 | Automobile has an active usage |
| `DRIVER_IN_USE` | 409 | Driver has an active usage |
| `USAGE_ALREADY_FINISHED` | 409 | Usage already has `endDate` |
| `AUTOMOBILE_HAS_USAGES` | 409 | Cannot delete automobile with usages |
| `DRIVER_HAS_USAGES` | 409 | Cannot delete driver with usages |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

---

## Health

### `GET /health`

**Response `200`**

```json
{ "status": "ok" }
```

---

## Automobiles

### `POST /automobiles`

**Request**

```json
{
  "plate": "ABC1D23",
  "color": "Silver",
  "brand": "Toyota"
}
```

**Response `201`** — header `Location: /automobiles/{id}`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "plate": "ABC1D23",
  "color": "Silver",
  "brand": "Toyota"
}
```

### `GET /automobiles`

Query (optional): `brand`, `color` — exact match, case-insensitive; combined with AND.

**Response `200`** — array of automobiles.

### `GET /automobiles/:id`

**Response `200`** — single automobile.  
**Response `404` / `422`** — not found / invalid id.

### `PUT /automobiles/:id`

Full replacement of mutable fields. Same body shape as create.

**Response `200`** — updated automobile.

### `DELETE /automobiles/:id`

**Response `204`** — empty body.  
**Response `409`** — `AUTOMOBILE_HAS_USAGES`.

---

## Drivers

### `POST /drivers`

```json
{ "name": "Ana Silva" }
```

**Response `201`** — header `Location: /drivers/{id}`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Ana Silva"
}
```

### `GET /drivers`

Query (optional): `name` — exact match, case-insensitive.

### `GET /drivers/:id`

### `PUT /drivers/:id`

```json
{ "name": "Ana Souza" }
```

### `DELETE /drivers/:id`

**Response `204`** or **`409`** (`DRIVER_HAS_USAGES`).

---

## Usages

### `POST /usages`

```json
{
  "automobileId": "550e8400-e29b-41d4-a716-446655440000",
  "driverId": "660e8400-e29b-41d4-a716-446655440001",
  "startDate": "2026-10-26T14:00:00.000Z",
  "reason": "Client visit"
}
```

**Response `201`** — header `Location: /usages/{id}`

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "automobileId": "550e8400-e29b-41d4-a716-446655440000",
  "driverId": "660e8400-e29b-41d4-a716-446655440001",
  "startDate": "2026-10-26T14:00:00.000Z",
  "endDate": null,
  "reason": "Client visit"
}
```

Conflict priority: if both automobile and driver are busy, respond with `AUTOMOBILE_IN_USE`.

### `POST /usages/:id/finish`

```json
{
  "endDate": "2026-10-26T18:00:00.000Z"
}
```

**Response `200`** — usage with `endDate` set.  
**Response `409`** — `USAGE_ALREADY_FINISHED`.  
**Response `422`** — `endDate` before `startDate` or invalid datetime.

### `GET /usages`

**Response `200`**

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "automobileId": "550e8400-e29b-41d4-a716-446655440000",
    "driverId": "660e8400-e29b-41d4-a716-446655440001",
    "startDate": "2026-10-26T14:00:00.000Z",
    "endDate": null,
    "reason": "Client visit",
    "driver": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Ana Silva"
    },
    "automobile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "plate": "ABC1D23",
      "color": "Silver",
      "brand": "Toyota"
    }
  }
]
```

Insertion order. Includes active and finished usages.

## Datetime rules

- Must be parseable ISO-8601 with time component (e.g. `2026-10-26T14:00:00.000Z`).
- Date-only values such as `2026-10-26` are rejected (`422`).
- Stored and returned as ISO strings in UTC.
