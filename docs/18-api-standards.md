# API Standards

## Purpose of This Document

This document defines the REST API conventions for Event OS: URL design, request/response formats, error handling, pagination, filtering, versioning, and authentication. All API endpoints follow these standards without exception.

---

## Base URL and Versioning

```
Production:  https://api.eventos.app/api/v1
Staging:     https://staging.eventos.app/api/v1
Development: http://localhost:4000/api/v1
```

- All endpoints prefixed with `/api/v1/`
- Version in URL path (not header)
- Breaking changes require a new version (`/api/v2/`)
- Non-breaking additions (new fields, new endpoints) are allowed within a version

---

## Authentication

### Request Authentication

```
Authorization: Bearer <access_token>
```

All endpoints except `/auth/login`, `/auth/refresh`, and `/auth/forgot-password` require authentication.

### Token Refresh

```
POST /api/v1/auth/refresh
Cookie: refresh_token=<http-only-cookie>

Response: { "accessToken": "..." }
```

---

## URL Design

### Resource Naming

| Rule | Example |
|------|---------|
| Plural nouns | `/leads`, `/quotations`, `/bookings` |
| kebab-case | `/calendar-entries`, `/line-items` |
| Nested for sub-resources | `/quotations/:id/line-items` |
| No verbs in URLs | `/leads` not `/getLeads`, `/createLead` |
| Actions as sub-paths | `/quotations/:id/send`, `/quotations/:id/approve` |

### Standard Resource Endpoints

```
GET    /api/v1/{resource}           → List (paginated)
POST   /api/v1/{resource}           → Create
GET    /api/v1/{resource}/:id     → Get by ID
PATCH  /api/v1/{resource}/:id     → Update (partial)
DELETE /api/v1/{resource}/:id     → Delete (soft)

POST   /api/v1/{resource}/:id/{action}  → Domain action (send, approve, cancel)
```

### Endpoint Registry (MVP)

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me

# Clients
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/:id
PATCH  /api/v1/clients/:id
DELETE /api/v1/clients/:id
POST   /api/v1/clients/:id/contacts
GET    /api/v1/clients/:id/interactions
POST   /api/v1/clients/:id/interactions

# Leads
GET    /api/v1/leads
POST   /api/v1/leads
GET    /api/v1/leads/:id
PATCH  /api/v1/leads/:id
DELETE /api/v1/leads/:id
PATCH  /api/v1/leads/:id/stage
POST   /api/v1/leads/:id/assign
GET    /api/v1/leads/pipeline

# Quotations
GET    /api/v1/quotations
POST   /api/v1/quotations
GET    /api/v1/quotations/:id
PATCH  /api/v1/quotations/:id
POST   /api/v1/quotations/:id/line-items
PATCH  /api/v1/quotations/:id/line-items/:itemId
DELETE /api/v1/quotations/:id/line-items/:itemId
POST   /api/v1/quotations/:id/send
POST   /api/v1/quotations/:id/approve
POST   /api/v1/quotations/:id/reject
POST   /api/v1/quotations/:id/revise
GET    /api/v1/quotations/:id/pdf

# Bookings
GET    /api/v1/bookings
POST   /api/v1/bookings
GET    /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/status
POST   /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/complete

# Calendar
GET    /api/v1/calendar
POST   /api/v1/calendar
GET    /api/v1/calendar/:id
PATCH  /api/v1/calendar/:id
DELETE /api/v1/calendar/:id

# Tasks
GET    /api/v1/tasks
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id/status

# Notifications
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/read-all

# Files
POST   /api/v1/files/upload
GET    /api/v1/files/:id

# AI
POST   /api/v1/ai/quotation-suggest
POST   /api/v1/ai/message-draft
POST   /api/v1/ai/assistant

# Tenant Settings
GET    /api/v1/settings
PATCH  /api/v1/settings
```

---

## Request Format

### Content Type

```
Content-Type: application/json
```

All request and response bodies are JSON. File uploads use `multipart/form-data`.

### Request Body Conventions

- camelCase for all JSON keys
- Dates as ISO 8601 strings: `"2026-12-15"` (date), `"2026-07-06T10:30:00Z"` (datetime)
- Money as object: `{ "amount": 50000, "currency": "INR" }`
- Phone as object: `{ "countryCode": "+91", "number": "9876543210" }`
- Optional fields omitted (not sent as `null`) on create
- `null` explicitly sent to clear a field on update

### Example: Create Lead

```http
POST /api/v1/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "source": "instagram",
  "sourceDetail": "DM on @wedecorevents post",
  "eventType": "Wedding",
  "eventDate": {
    "start": "2026-12-15",
    "end": "2026-12-15"
  },
  "venue": "Taj Palace, Mumbai",
  "estimatedBudget": {
    "amount": 500000,
    "currency": "INR"
  },
  "guestCount": 300,
  "notes": "Looking for premium floral decor with stage setup"
}
```

---

## Response Format

### Success Response: Single Resource

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "source": "instagram",
    "eventType": "Wedding",
    "stage": "new",
    "priority": "medium",
    "assignedTo": null,
    "clientId": null,
    "estimatedBudget": {
      "amount": 500000,
      "currency": "INR"
    },
    "createdAt": "2026-07-06T10:30:00Z",
    "updatedAt": "2026-07-06T10:30:00Z"
  }
}
```

All success responses wrap data in a `data` key.

### Success Response: List (Paginated)

```json
{
  "data": [
    { "id": "...", "source": "instagram", "stage": "new", "..." },
    { "id": "...", "source": "website", "stage": "contacted", "..." }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Success Response: Action

```json
{
  "data": {
    "id": "...",
    "status": "sent",
    "sentAt": "2026-07-06T11:00:00Z"
  },
  "message": "Quotation sent successfully."
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200 OK` | Successful GET, PATCH, action |
| `201 Created` | Successful POST (resource created) |
| `204 No Content` | Successful DELETE |
| `400 Bad Request` | Validation error, malformed request |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource not found (or not in user's tenant) |
| `409 Conflict` | Business rule violation (e.g., invalid stage transition) |
| `422 Unprocessable Entity` | Semantically invalid (e.g., expired quotation) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "source",
        "message": "Source must be one of: instagram, website, whatsapp, referral, walk_in, phone, other"
      },
      {
        "field": "eventType",
        "message": "Event type is required."
      }
    ],
    "requestId": "req_abc123def456"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or token expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Concurrent modification or state conflict |
| `INVALID_STAGE_TRANSITION` | 409 | Lead stage transition not allowed |
| `QUOTATION_NOT_EDITABLE` | 409 | Quotation cannot be modified in current status |
| `BOOKING_ALREADY_EXISTS` | 409 | Booking already exists for this quotation |
| `INSUFFICIENT_INVENTORY` | 409 | Not enough inventory available |
| `QUOTATION_EXPIRED` | 422 | Quotation validity period has passed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Pagination

### Offset Pagination (Default)

```
GET /api/v1/leads?page=2&pageSize=20
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Page number (1-indexed) |
| `pageSize` | 20 | 100 | Items per page |

### Cursor Pagination (Large Datasets)

```
GET /api/v1/leads?cursor=eyJjcmVhdGVkQXQiOiIyMDI2LTA3LTA2VDEwOjMwOjAwWiJ9&pageSize=20
```

Response includes `meta.nextCursor` when more results exist.

Use cursor pagination for: activity feeds, notification lists, audit logs.

---

## Filtering and Sorting

### Filtering

```
GET /api/v1/leads?stage=quoted&assignedTo=user-id&source=instagram
```

- Filters passed as query parameters
- Multiple values comma-separated: `?stage=quoted,won`
- Date range: `?createdAfter=2026-07-01&createdBefore=2026-07-31`
- Search: `?search=rajesh` (full-text search on relevant fields)

### Sorting

```
GET /api/v1/leads?sortBy=createdAt&sortOrder=desc
```

| Parameter | Default | Values |
|-----------|---------|--------|
| `sortBy` | `createdAt` | Any indexed field |
| `sortOrder` | `desc` | `asc`, `desc` |

### Field Selection (Sparse Fieldsets)

```
GET /api/v1/leads?fields=id,source,stage,eventType
```

Returns only specified fields. Reduces payload for list views.

### Including Related Data

```
GET /api/v1/leads/:id?include=client,assignedStaff,quotations
```

Comma-separated list of relations to embed in response. Use sparingly (prefer dedicated endpoints for complex relations).

---

## Idempotency

For non-idempotent POST actions that should not be duplicated (send quotation, record payment):

```
POST /api/v1/quotations/:id/send
Idempotency-Key: <uuid>
```

- Client generates a UUID for each intent
- Server stores idempotency key with response for 24 hours
- Duplicate requests with same key return the original response

---

## Rate Limiting

Rate limit headers included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1720252800
```

When exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "requestId": "req_..."
  }
}
```

---

## Webhooks (Phase 4+)

Outbound webhooks for tenant-configured integrations:

```json
POST {tenant_webhook_url}
Content-Type: application/json
X-EventOS-Signature: sha256=<hmac>
X-EventOS-Event: quotation.approved

{
  "eventType": "quotation.approved",
  "tenantId": "...",
  "timestamp": "2026-07-06T11:00:00Z",
  "data": {
    "quotationId": "...",
    "clientId": "...",
    "total": { "amount": 500000, "currency": "INR" }
  }
}
```

---

## OpenAPI Specification

- OpenAPI 3.1 specification auto-generated from code decorators or maintained in `apps/api/openapi.yaml`
- Hosted at `/api/v1/docs` (Swagger UI) in development and staging
- Not exposed in production (security)
- Used to generate typed API client for frontend (`packages/shared-types`)

---

## API Design Rules

1. **Tenant context from auth, never from request body** — `tenantId` is never a request parameter
2. **Consistent naming** — API fields match domain model (see [04-business-domain.md](./04-business-domain.md))
3. **Backward compatible changes only** — New optional fields OK; removing/renaming fields requires new API version
4. **Actions are POST** — `/quotations/:id/approve`, not `PATCH /quotations/:id { status: "approved" }` (except simple field updates)
5. **Soft delete returns 204** — Resource hidden from lists, recoverable by admin
6. **404 for cross-tenant access** — Never 403 for missing resources in other tenants (prevents information leakage)
7. **Money always as object** — `{ amount, currency }`, never bare numbers
8. **Dates always ISO 8601** — UTC for timestamps, date-only for event dates

---

## Related Documents

| Document | Topic |
|----------|-------|
| [04-business-domain.md](./04-business-domain.md) | Domain model reflected in API |
| [05-system-architecture.md](./05-system-architecture.md) | API in system architecture |
| [08-coding-standards.md](./08-coding-standards.md) | Controller implementation standards |
| [14-security-principles.md](./14-security-principles.md) | API security |
| [15-testing-strategy.md](./15-testing-strategy.md) | API integration testing |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
