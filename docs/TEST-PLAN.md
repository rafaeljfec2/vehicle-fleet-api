# Fleet Management API — Test Plan

## Strategy

- **Unit tests** (required by the assessment): services for automobiles, drivers, and usages (including occupancy conflicts), env loading, and error helpers.
- **Integration (HTTP) tests**: Supertest against `createApp()` with fresh in-memory repositories per test.
- Test descriptions in English.
- Do not claim pass/fail without command output evidence.

## Matrix

### Foundation

| ID | Case | Type | Expected |
|---|---|---|---|
| T-F1 | `GET /health` | HTTP | 200, `{ status: "ok" }` |
| T-F2 | Unknown route | HTTP | 404, `NOT_FOUND` |
| T-F3 | Malformed JSON body | HTTP | 400, `MALFORMED_JSON` |
| T-F4 | `AppError` maps to HTTP status and envelope | Unit | Correct status/code |

### Automobiles

| ID | Case | Type | Expected |
|---|---|---|---|
| T-A1 | Create valid automobile | HTTP | 201, body with `id`, `Location` |
| T-A2 | Create missing fields | HTTP | 422 |
| T-A3 | Create duplicate plate (different case) | HTTP | 409, `DUPLICATE_PLATE` |
| T-A4 | Get by id | HTTP | 200 |
| T-A5 | Get unknown id | HTTP | 404 |
| T-A6 | Get malformed uuid | HTTP | 422 |
| T-A7 | List all | HTTP | 200, insertion order |
| T-A8 | Filter by brand | HTTP | Matching items only |
| T-A9 | Filter by color | HTTP | Matching items only |
| T-A10 | Filter brand AND color | HTTP | Intersection |
| T-A11 | Update | HTTP | 200, fields replaced |
| T-A12 | Delete without usages | HTTP | 204 |
| T-A13 | Delete unknown | HTTP | 404 |
| T-A14 | Delete with usage history | HTTP | 409, `AUTOMOBILE_HAS_USAGES` |

### Drivers

| ID | Case | Type | Expected |
|---|---|---|---|
| T-D1 | Create valid | HTTP | 201 |
| T-D2 | Create invalid name | HTTP | 422 |
| T-D3 | Get / list / filter by name | HTTP | 200 |
| T-D4 | Update | HTTP | 200 |
| T-D5 | Delete without usages | HTTP | 204 |
| T-D6 | Delete with usages | HTTP | 409, `DRIVER_HAS_USAGES` |

### Usages

| ID | Case | Type | Expected |
|---|---|---|---|
| T-U1 | Start valid usage | HTTP | 201, `endDate: null` |
| T-U2 | Block automobile already in use | HTTP | 409, `AUTOMOBILE_IN_USE` |
| T-U3 | Block driver already using another automobile | HTTP | 409, `DRIVER_IN_USE` |
| T-U4 | Allow reuse after finish | HTTP | Second start 201 |
| T-U5 | Finish active usage | HTTP | 200, `endDate` set |
| T-U6 | Block second finish | HTTP | 409, `USAGE_ALREADY_FINISHED` |
| T-U7 | Reject non-existent automobile/driver | HTTP | 404 |
| T-U8 | List history with related data | HTTP | Nested driver and automobile |
| T-U9 | Concurrent start for same automobile | HTTP | Exactly one 201, one 409 |
| T-U10 | `endDate` before `startDate` | HTTP | 422 |
| T-U11 | Date-only `startDate` rejected | HTTP | 422 |
| T-U12 | Both busy → automobile conflict first | Unit/HTTP | `AUTOMOBILE_IN_USE` |

## Concurrency note

T-U9 fires two simultaneous `POST /usages` against the same process. Synchronous check-and-set on the event loop must ensure exactly one succeeds. Multi-instance safety is out of scope.
