# Event OS API Design

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Founding Engineering |
| **Primary Reviewer** | Ilyas + Zakir (We Decor Events) |
| **Status** | Draft — engineering approval |
| **Version** | 1.10 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-29 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Define the application service layer and REST API contract between UI and the approved domain model. Blueprint for NestJS controllers and application services. Phase 1 OpenAPI freeze artifact: `apps/api/openapi/openapi.v1.json` (R3-13). Admin Portal (`apps/web`) F1-01–F1-13 synchronized in R4-01. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|---------|---------------------|
| 1.0 | 2026-07-08 | Founding Engineering | Phase 1 API contract (W1–W5) from `07-domain-model`, `08-data-model`, ADR-016/017 |
| 1.1 | 2026-07-08 | Founding Engineering | Migrated technology wording from Spring Boot controllers/services to NestJS controllers and application services (no API or behaviour change). |
| 1.2 | 2026-07-13 | Founding Engineering | R3-09: added canonical Phase 1 role × permission matrix mirroring `rbac.ts` (documentation only). |
| 1.3 | 2026-07-13 | Founding Engineering | R3-12: synced endpoint↔permission map and CRM contracts to shipped controllers; unbound-permission list reduced; review-request roles aligned to `reviews:write` matrix. |
| 1.4 | 2026-07-13 | Founding Engineering | R3-13: Phase 1 OpenAPI / Swagger contract freeze — document freeze rules; point to `apps/api/openapi/openapi.v1.json`. |
| 1.5 | 2026-07-13 | Founding Engineering | R4-01: Sync endpoint/DTO wording to frozen OpenAPI + Admin Portal (F1-01–F1-13); hub-when-no-list; thin workspace; finance/inventory wire shapes. |
| 1.6 | 2026-07-19 | Founding Engineering | P2-08: financial document endpoints + `documents:*` permissions; finance/viewer matrix grants. |
| 1.7 | 2026-07-19 | Founding Engineering | P2-09: `/communications`, `/communication-templates`, `/reminders`, booking nested lists, communication permissions. |
| 1.8 | 2026-07-19 | Founding Engineering | P2-10: `/calendar`, `/calendar/events`, `/calendar/agenda`, `/calendar/timeline`, `/calendar/conflicts` (all `calendar:read`, read-only aggregation); `WorkspaceDto` unchanged. |
| 1.9 | 2026-07-29 | Founding Engineering | P2-11: Customer 360 under `/clients/:customerId/` — `overview`, `timeline`, `bookings`, `relationship`, `financial-summary`, `communications` (all `clients:read`); no new permission; `WorkspaceDto` unchanged. |
| 1.10 | 2026-07-29 | Founding Engineering | P2-12: BI under `/analytics/*` — dashboard, sales, finance, staff, vendors, inventory, customers, operations, trends, export (all `analytics:read`); Phase-1 `/dashboards/*` remains frozen; no Prisma migration. |

---

## Purpose

This document translates the approved domain model and logical persistence model into an implementation-ready REST API contract.

Primary inputs:

- Phase 1 business baseline: `docs/business/19-event-os-phase1-requirements.md`
- Authoritative domain model: `docs/07-domain-model.md`
- Authoritative logical persistence: `docs/08-data-model.md`
- Tenancy + module boundaries: `docs/05-system-architecture.md`, `docs/06-module-design.md`
- REST conventions: `docs/18-api-standards.md`
- Constraints:
  - Single-tenant Phase 1 mode: ADR-016
  - Suggestion-only domain event handlers in Phase 1: ADR-017

---

## Scope

### In scope (Phase 1 only)

REST API design grouped by module:

1. Lead Management
2. Customer
3. Quotation
4. Booking
5. Event Workspace
6. Task Management
7. Staff Management
8. Vendor Procurement
9. Inventory
10. Payments
11. Finance
12. Dashboard
13. Administration

All endpoints are limited to the approved Phase 1 capabilities and must-pass workflows W1–W5.

### Out of scope

- No SQL schema / DDL / migrations
- No API DTO classes / OpenAPI YAML
- No multi-tenant SaaS lifecycle (Doc `20`)
- No AI assistant core and no full WhatsApp replacement
- No new business workflows or operational stages beyond Doc `19`

---

## References

| Document | Role |
|----------|------|
| `docs/business/19-event-os-phase1-requirements.md` | Frozen Phase 1 scope, EP1 IDs, W1–W5 |
| `docs/07-domain-model.md` | Aggregates, entities, invariants, lifecycles |
| `docs/08-data-model.md` | Persistence model rules, identifier + concurrency guidance |
| `docs/05-system-architecture.md` | Tenancy + RBAC roles, authorization boundaries |
| `docs/06-module-design.md` | Module responsibilities and Phase 1 coverage |
| `docs/18-api-standards.md` | REST URL conventions, response envelope, errors, pagination/filtering/sorting |
| `docs/12-architecture-decisions.md` | ADR-016 and ADR-017 |
| `docs/14-security-principles.md` | RBAC + permissions expectations, validation at API boundary |

---

## API Design Principles

All endpoints follow `docs/18-api-standards.md`:

- Versioned base path: `/api/v1/...`
- All success responses wrap payload in `{ "data": ... }`
- All request/response bodies are JSON, except file upload uses `multipart/form-data`
- **Money on the wire (Phase 1 OpenAPI):** most write/read DTOs for payments, expenses, and invoice line prices use **flat** fields `amount` / `unitPriceAmount` + `currency`. Nested `{ amount, currency }` Money objects appear on **derived** read models (e.g. profitability, founder KPI `grossMargin`). Do not invent nested Money on write bodies that the OpenAPI defines as flat.
- Dates are ISO 8601
- Tenant context is always derived from auth context (ADR-016); `tenantId` is never in request payload/query
- **Resource naming:** HTTP resource for the unified event hub is **`bookings`** (`/api/v1/bookings/...`). Domain language may still say Event; UI may say Booking/Event interchangeably. Customer HTTP resource is **`clients`** (`/api/v1/clients/...`); Admin Portal UI label is “Customers” with permissions `clients:*`.

Phase 1 business constraints:

- Domain-event handlers in Phase 1 produce **suggestions/alerts only** (ADR-017)
- Any business action requires explicit human confirmation (EP1-AUT-005); human confirmation may be either:
  - user directly invoking a command endpoint, or
  - accepting a pending suggestion via `POST /api/v1/suggestions/:id/accept`
- Hard blocks enforced in application layer before mutation:
  - EP1-BR-001 (advance before Approved)
  - EP1-BR-002 (financial review before Completed)
  - EP1-BR-003 (execution ownership before execution stages)

---

## Authentication & Authorization Assumptions

Authentication:

- `Authorization: Bearer <access_token>`

Authorization (Phase 1):

- **Authority order for RBAC wording:** this document’s **[Phase 1 Role × Permission Matrix](#phase-1-role--permission-matrix-canonical--r3-09)** (R3-09) is the canonical documentation of grants; it must match `apps/api/src/modules/auth/domain/rbac.ts`. Per-endpoint **Required role** / **Expected permission** lines must not contradict that matrix. [`docs/14-security-principles.md`](./14-security-principles.md) defines the permission-key convention and application-layer enforcement. [`docs/05-system-architecture.md`](./05-system-architecture.md) §Authorization Model is a summary only.
- Implementation source of truth for the grant map: `apps/api/src/modules/auth/domain/rbac.ts` (`ROLE_PERMISSIONS`), evaluated by `PermissionService`.
- Roles (nine Phase 1 identifiers):
  - `owner`, `admin` — both receive **all** Phase 1 permission keys, including Administration `settings:read` / `settings:write` (see §Administration below). There is no Phase 1 admin carve-out that excludes billing/tenant settings.
  - `sales_manager`, `sales`
  - `operations_manager`, `coordinator`
  - `finance`
  - `marketing` — Phase 1 **limited**: role exists for forward compatibility; **no** docs/09 endpoints currently grant marketing-only access, and the implementation assigns an **empty** permission set until CMS/content APIs ship (Phase 4+)
  - `viewer` (read-only where listed on read endpoints)
- Single role per user; single tenant (ADR-016).

Permissions:

- This doc specifies expected permission keys per endpoint using the convention `<resource>:<action>` (consistent with `docs/14-security-principles.md` examples like `leads:read`, `leads:assign`, `quotations:approve`).
- Permission checks must happen in the application service layer (per security principles), with HTTP enforcement via the global permissions guard.

---


## Phase 1 Role × Permission Matrix (canonical — R3-09)

> **Authority:** `apps/api/src/modules/auth/domain/rbac.ts` (`PERMISSIONS`, `ROLE_PERMISSIONS`) is the
> **single source of truth** for which roles hold which keys. This section is the canonical
> **documentation** mirror of that file. Per-endpoint narratives below must not invent keys or
> grants that disagree with this matrix. Summary tables in `docs/05` are non-authoritative.
>
> Evaluated at runtime by `PermissionService` + `PermissionsGuard`.

### Phase 1 assumptions

| Assumption | Rule |
|------------|------|
| Roles | Exactly nine identifiers: `owner`, `admin`, `sales_manager`, `sales`, `operations_manager`, `coordinator`, `finance`, `marketing`, `viewer` |
| Assignment | **One role per user** |
| Tenancy | Single We Decor tenant (**ADR-016**) |
| Key convention | `<resource>:<action>` (`docs/14`) |
| `owner` / `admin` | Identical Phase 1 grants — **all** permission keys in `PERMISSIONS` (including `settings:*`, finance, and `documents:*`) |
| `marketing` | Role exists; **zero** permissions in Phase 1 |
| Automation | Suggestion accept/dismiss still human-gated (**ADR-017**); permissions gate who may act |

### Explicitly out of Phase 1 (do not document as Phase 1 RBAC)

- ABAC / attribute policies
- Multi-role assignment per user
- Organization hierarchy / team-scoped grants beyond application filters already described
- Multi-tenant RBAC / cross-tenant roles (Phase 6+ SaaS)
- Dynamic policy engine / external IdP authorization
- CMS / Instagram / marketing-platform permissions (Phase 4+)

### Permission catalog

All keys below appear in `PERMISSIONS` in `rbac.ts`. Resource/action is the key itself.

| Resource prefix | Keys |
|-----------------|------|
| `leads` | `leads:read`, `leads:write`, `leads:stage:update`, `leads:assign`, `leads:followups:write` |
| `clients` / CRM | `clients:read`, `clients:write`, `timeline:read`, `timeline:write`, `issues:write`, `reviews:write` |
| `quotations` | `quotations:read`, `quotations:write`, `quotations:send`, `quotations:approve`, `quotations:reject`, `quotations:revise` |
| `bookings` | `bookings:read`, `bookings:status:update`, `bookings:cancel`, `bookings:complete`, `bookings:execution:advance` |
| `workspace` | `workspace:read`, `workspace:activate`, `workspace:notes:write` |
| `tasks` | `tasks:read`, `tasks:write`, `tasks:status:update` |
| `checklists` | `checklists:read`, `checklists:write`, `checklists:execute` |
| `staff` | `staff:read`, `staff:write` |
| `vendors` / procurement | `vendors:read`, `vendors:write`, `procurements:read`, `procurements:write`, `procurement:transition`, `procurement:notes:write` |
| `inventory` | `inventory:read`, `inventory:write`, `inventory:move:write`, `inventory:move:confirm`, `inventory:photos:write`, `inventory:damage-notes:write` |
| `payments` | `payments:read`, `payments:record`, `payments:void` |
| finance | `invoices:read`, `invoices:write`, `invoices:send`, `invoices:void`, `expenses:read`, `expenses:write`, `expenses:void`, `profitability:read` |
| `documents` | `documents:read`, `documents:write`, `documents:verify` |
| `communications` | `communications:read`, `communications:write` |
| `communication-templates` | `communication-templates:read`, `communication-templates:write` |
| `reminders` | `reminders:read`, `reminders:write` |
| `calendar` | `calendar:read` |
| `analytics` | `analytics:read` |
| `dashboards` | `dashboards:read` |
| administration | `suggestions:read`, `suggestions:accept`, `suggestions:dismiss`, `settings:read`, `settings:write` |

### Role × permission matrix

Exact mirror of `ROLE_PERMISSIONS` (✓ = granted, — = not granted).

| Permission | O | A | SM | S | OM | C | F | M | V |
|------------|:-:|:-:|:--:|:-:|:--:|:-:|:-:|:-:|:-:|
| `leads:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| `leads:write` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| `leads:stage:update` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `leads:assign` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `leads:followups:write` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| `clients:read` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| `clients:write` | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — |
| `timeline:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |
| `timeline:write` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| `issues:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `reviews:write` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `quotations:read` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| `quotations:write` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| `quotations:send` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| `quotations:approve` | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — |
| `quotations:reject` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `quotations:revise` | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| `bookings:read` | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓ |
| `bookings:status:update` | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | — |
| `bookings:cancel` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `bookings:complete` | ✓ | ✓ | — | — | ✓ | — | ✓ | — | — |
| `bookings:execution:advance` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `workspace:read` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | ✓ |
| `workspace:activate` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `workspace:notes:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `tasks:read` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | ✓ |
| `tasks:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `tasks:status:update` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `checklists:read` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | ✓ |
| `checklists:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `checklists:execute` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `staff:read` | ✓ | ✓ | — | — | ✓ | — | — | — | ✓ |
| `staff:write` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `vendors:read` | ✓ | ✓ | — | — | ✓ | — | — | — | ✓ |
| `vendors:write` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `procurements:read` | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — | ✓ |
| `procurements:write` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `procurement:transition` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `procurement:notes:write` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `inventory:read` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | ✓ |
| `inventory:write` | ✓ | ✓ | — | — | ✓ | — | — | — | — |
| `inventory:move:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `inventory:move:confirm` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `inventory:photos:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `inventory:damage-notes:write` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `payments:read` | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ |
| `payments:record` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `payments:void` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `invoices:read` | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ |
| `invoices:write` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `invoices:send` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `invoices:void` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `expenses:read` | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ |
| `expenses:write` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `expenses:void` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `profitability:read` | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ |
| `documents:read` | ✓ | ✓ | — | — | — | — | ✓ | — | ✓ |
| `documents:write` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `documents:verify` | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| `communications:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |
| `communications:write` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| `communication-templates:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |
| `communication-templates:write` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| `reminders:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |
| `reminders:write` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| `calendar:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |
| `analytics:read` | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | ✓ |
| `dashboards:read` | ✓ | ✓ | ✓ | — | — | — | — | — | ✓ |
| `suggestions:read` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `suggestions:accept` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `suggestions:dismiss` | ✓ | ✓ | — | — | ✓ | ✓ | — | — | — |
| `settings:read` | ✓ | ✓ | — | — | — | — | — | — | — |
| `settings:write` | ✓ | ✓ | — | — | — | — | — | — | — |

Legend: **O** owner · **A** admin · **SM** sales_manager · **S** sales · **OM** operations_manager · **C** coordinator · **F** finance · **M** marketing · **V** viewer

### Owner / admin special handling

| Topic | Rule |
|-------|------|
| Grant set | `owner` and `admin` both use the full `PERMISSIONS` array |
| Settings | Both hold `settings:read` and `settings:write` (Administration module) |
| Phase 1 billing carve-out | **None** — do not exclude finance or settings from `admin` |
| Differentiation | Reserved for future SaaS tenant-billing separation; not Phase 1 |

### Marketing (zero permissions)

`ROLE_PERMISSIONS.marketing = []`. The role identifier is reserved for Phase 4+ CMS/content APIs. In Phase 1, a user with role `marketing` fails every `@Permissions(...)` check (deny-by-default).

### Endpoint ↔ permission map (implemented controllers)

Paths are under global prefix `/api/v1` unless noted. Health probes are `@Public()` (no permission). Auth `POST /auth/login` and `POST /auth/refresh` are `@Public()`; `POST /auth/logout` and `POST /auth/change-password` require authentication (JWT) but have no `@Permissions` (any authenticated role).

| Permission | Implemented routes (representative) |
|------------|-------------------------------------|
| `leads:read` | `GET /leads`, `GET /leads/:id` |
| `leads:write` | `POST /leads` |
| `leads:stage:update` | `PATCH /leads/:id/stage` |
| `leads:assign` | `POST /leads/:id/assign` |
| `leads:followups:write` | `POST /leads/:id/follow-ups`, `PATCH /follow-ups/:id` |
| `clients:read` | `GET /clients/:id`; P2-11 Customer 360: `GET /clients/:customerId/overview`, `/timeline`, `/bookings`, `/relationship`, `/financial-summary`, `/communications` (no list route in Phase 1) |
| `clients:write` | `POST /clients`, `PATCH /clients/:id`, `POST /clients/:customerId/contacts` |
| `timeline:read` | `GET /clients/:customerId/interactions` |
| `timeline:write` | `POST /clients/:customerId/interactions` |
| `issues:write` | `POST /events/:eventId/issues` |
| `reviews:write` | `POST /events/:eventId/review-requests` |
| `quotations:read` | `GET /quotations/:id` |
| `quotations:write` | `POST/PATCH /quotations`, line-item mutate routes |
| `quotations:send` | `POST /quotations/:id/send` |
| `quotations:approve` | `POST /quotations/:id/approve` |
| `quotations:reject` | `POST /quotations/:id/reject` |
| `quotations:revise` | `POST /quotations/:id/revise` |
| `bookings:read` | `GET /bookings/:id` |
| `bookings:status:update` | `PATCH /bookings/:id/status` |
| `bookings:cancel` | `POST /bookings/:id/cancel` |
| `bookings:complete` | `POST /bookings/:id/complete` |
| `bookings:execution:advance` | `POST /bookings/:id/execution-owner`, `.../execution-stages/advance` |
| `workspace:read` | `GET /bookings/:id/workspace` |
| `workspace:activate` | `POST /bookings/:id/activate-workspace` |
| `workspace:notes:write` | `POST/DELETE /bookings/:id/notes` |
| `tasks:read` | `GET /tasks`, `GET /tasks/:id` |
| `tasks:write` | `POST/PATCH /tasks`, checklist mutate routes |
| `tasks:status:update` | `PATCH /tasks/:id/status` |
| `checklists:read` | `GET /checklist-templates`, `GET /event-checklists` |
| `checklists:write` | `POST/PATCH /checklist-templates`, `POST /event-checklists/generate` |
| `checklists:execute` | `PATCH /event-checklists/:id/items/:itemId` |
| `staff:read` | `GET /staff`, `GET /staff/:id`, `GET /staff-assignments`, `GET /staff-assignments/:id`, `GET /staff-availability`, `GET /staff-leave`, `GET /scheduling/*` |
| `staff:write` | `POST /staff`, `PATCH /staff/:id`, `POST /staff-assignments`, confirm/release/cancel, `POST/PATCH/DELETE /staff-availability`, `POST /staff-leave`, `POST /staff-leave/:id/review` |
| `vendors:read` | `GET /vendors`, `GET /vendors/:id` |
| `vendors:write` | `POST/PATCH /vendors`, issue-notes |
| `procurements:read` | `GET /bookings/:id/procurements` |
| `procurements:write` | `POST /bookings/:id/procurements`, `POST /procurements/:id/lines` |
| `procurement:transition` | `POST /procurement/lines/:lineId/transition` |
| `procurement:notes:write` | `POST /procurement/lines/:lineId/issue-notes` |
| `inventory:read` | `GET /inventory/items`, `GET /inventory/movements`, `GET /inventory/movements/:id`, `GET /bookings/:id/inventory-movements`, `GET /bookings/:id/inventory-reservations`, `GET /inventory-reservations/:id`, `GET /inventory-verification/by-movement/:movementId`, `GET /inventory-damage/by-movement/:movementId` |
| `inventory:write` | `POST /inventory/items`, `PATCH /inventory/items/:id`, `POST /inventory-reservations`, `PATCH /inventory-reservations/:id`, `POST /inventory-reservations/:id/release`, `POST /inventory-reservations/:id/cancel` |
| `inventory:move:write` | `POST /inventory/movements` |
| `inventory:move:confirm` | `POST /inventory/movements/:movementId/transition`, `POST /inventory-verification/:movementId` |
| `inventory:damage-notes:write` | `POST /inventory/movements/:movementId/damage-notes`, `POST /inventory-damage/:movementId` |
| `payments:read` | `GET /bookings/:id/payments` |
| `payments:record` | `POST /payments` |
| `payments:void` | `POST /payments/:id/void` |
| `invoices:read` | `GET /bookings/:id/invoices` |
| `invoices:write` | `POST /invoices` |
| `invoices:send` | `POST /invoices/:id/send` |
| `invoices:void` | `POST /invoices/:id/void` |
| `expenses:read` | `GET /bookings/:id/expenses` |
| `expenses:write` | `POST /bookings/:id/expenses` |
| `expenses:void` | `POST /expenses/:id/void` |
| `profitability:read` | `GET /bookings/:id/profitability` |
| `documents:read` | `GET /financial-documents/:id`, `GET /financial-documents/:id/audit-events`, `GET /payment-documents/:paymentId`, `GET /expense-documents/:expenseId`, `GET /bookings/:id/financial-documents` |
| `documents:write` | `POST /financial-documents`, `PATCH /financial-documents/:id`, `POST /financial-documents/:id/delete` |
| `documents:verify` | `POST /financial-documents/:id/verify`, `POST /financial-documents/:id/reject` |
| `communications:read` | `GET /communications`, `GET /communications/:id`, `GET /communications/:id/attachments`, `GET /bookings/:id/communications` |
| `communications:write` | `POST /communications`, `PATCH /communications/:id`, `POST /communications/:id/transition`, `POST /communications/:id/delete`, `POST /communications/:id/attachments`, `POST /communications/:id/attachments/:attachmentId/delete` |
| `communication-templates:read` | `GET /communication-templates`, `GET /communication-templates/:id` |
| `communication-templates:write` | `POST /communication-templates`, `PATCH /communication-templates/:id`, `POST /communication-templates/:id/archive` |
| `reminders:read` | `GET /reminders`, `GET /reminders/:id`, `GET /bookings/:id/reminders` |
| `reminders:write` | `POST /reminders`, `POST /reminders/:id/complete`, `POST /reminders/:id/cancel` |
| `calendar:read` | `GET /calendar`, `GET /calendar/events`, `GET /calendar/agenda`, `GET /calendar/timeline`, `GET /calendar/conflicts` |
| `analytics:read` | P2-12 BI: `GET /analytics/dashboard`, `/sales`, `/finance`, `/staff`, `/vendors`, `/inventory`, `/customers`, `/operations`, `/trends`, `/export` |
| `dashboards:read` | `GET /dashboards/*` (Phase-1 founder KPIs — **frozen**; P2-12 BI uses `/analytics/*`) |
| `suggestions:read` | `GET /suggestions` |
| `suggestions:accept` | `POST /suggestions/:id/accept` |
| `suggestions:dismiss` | `POST /suggestions/:id/dismiss` |
| `settings:read` | `GET /settings` |
| `settings:write` | `PATCH /settings` |

### Permissions granted but not yet bound to a shipped controller route

These keys exist in `PERMISSIONS` / `ROLE_PERMISSIONS`; wire `@Permissions` when the corresponding controllers land (do **not** remove the grants):

| Permission | Documented module surface (this file) |
|------------|----------------------------------------|
| `inventory:photos:write` | Inventory / movement photos (Attachment upload — deferred) |

### Per-role grant lists (verbatim from `ROLE_PERMISSIONS`)

Use for line-by-line review against code. Counts must match `rbac.ts`.

| Role | Permission count |
|------|-----------------:|
| `owner` | all (`PERMISSIONS`) |
| `admin` | all (`PERMISSIONS`) |
| `sales_manager` | 25 |
| `sales` | 7 |
| `operations_manager` | 46 |
| `coordinator` | 34 |
| `finance` | 20 |
| `marketing` | 0 |
| `viewer` | 23 |

### `owner` (all permissions)

All keys in the permission catalog / matrix above (identical to `PERMISSIONS` in `rbac.ts`).

### `admin` (all permissions)

All keys in the permission catalog / matrix above (identical to `PERMISSIONS` in `rbac.ts`).

### `sales_manager` (25 permissions)

- `leads:read`
- `leads:write`
- `leads:stage:update`
- `leads:assign`
- `leads:followups:write`
- `clients:read`
- `clients:write`
- `timeline:read`
- `timeline:write`
- `reviews:write`
- `quotations:read`
- `quotations:write`
- `quotations:send`
- `quotations:approve`
- `quotations:reject`
- `quotations:revise`
- `communications:read`
- `communications:write`
- `communication-templates:read`
- `communication-templates:write`
- `reminders:read`
- `reminders:write`
- `calendar:read`
- `analytics:read`
- `dashboards:read`

### `sales` (7 permissions)

- `leads:read`
- `leads:write`
- `leads:followups:write`
- `clients:read`
- `quotations:read`
- `quotations:write`
- `quotations:send`

### `operations_manager` (46 permissions)

- `leads:read`
- `clients:read`
- `clients:write`
- `timeline:read`
- `timeline:write`
- `issues:write`
- `quotations:approve`
- `bookings:read`
- `bookings:status:update`
- `bookings:cancel`
- `bookings:complete`
- `bookings:execution:advance`
- `workspace:read`
- `workspace:activate`
- `workspace:notes:write`
- `tasks:read`
- `tasks:write`
- `tasks:status:update`
- `checklists:read`
- `checklists:write`
- `checklists:execute`
- `staff:read`
- `staff:write`
- `vendors:read`
- `vendors:write`
- `procurements:read`
- `procurements:write`
- `procurement:transition`
- `procurement:notes:write`
- `inventory:read`
- `inventory:write`
- `inventory:move:write`
- `inventory:move:confirm`
- `inventory:photos:write`
- `inventory:damage-notes:write`
- `communications:read`
- `communications:write`
- `communication-templates:read`
- `communication-templates:write`
- `reminders:read`
- `reminders:write`
- `calendar:read`
- `analytics:read`
- `suggestions:read`
- `suggestions:accept`
- `suggestions:dismiss`

### `coordinator` (34 permissions)

- `leads:read`
- `clients:read`
- `timeline:read`
- `timeline:write`
- `issues:write`
- `bookings:read`
- `bookings:status:update`
- `bookings:execution:advance`
- `workspace:read`
- `workspace:activate`
- `workspace:notes:write`
- `tasks:read`
- `tasks:write`
- `tasks:status:update`
- `checklists:read`
- `checklists:write`
- `checklists:execute`
- `procurements:read`
- `inventory:read`
- `inventory:move:write`
- `inventory:move:confirm`
- `inventory:photos:write`
- `inventory:damage-notes:write`
- `communications:read`
- `communications:write`
- `communication-templates:read`
- `communication-templates:write`
- `reminders:read`
- `reminders:write`
- `calendar:read`
- `analytics:read`
- `suggestions:read`
- `suggestions:accept`
- `suggestions:dismiss`

### `finance` (20 permissions)

- `leads:read`
- `bookings:read`
- `bookings:status:update`
- `bookings:complete`
- `procurements:read`
- `payments:read`
- `payments:record`
- `payments:void`
- `invoices:read`
- `invoices:write`
- `invoices:send`
- `invoices:void`
- `expenses:read`
- `expenses:write`
- `expenses:void`
- `profitability:read`
- `documents:read`
- `documents:write`
- `documents:verify`
- `analytics:read`

### `marketing` (0 permissions)

_None — intentionally empty in Phase 1._

### `viewer` (23 permissions)

- `leads:read`
- `clients:read`
- `timeline:read`
- `quotations:read`
- `bookings:read`
- `workspace:read`
- `tasks:read`
- `checklists:read`
- `staff:read`
- `vendors:read`
- `procurements:read`
- `inventory:read`
- `payments:read`
- `invoices:read`
- `expenses:read`
- `profitability:read`
- `documents:read`
- `communications:read`
- `communication-templates:read`
- `reminders:read`
- `calendar:read`
- `analytics:read`
- `dashboards:read`

## Tenant Context Handling (ADR-016)

- Phase 1 is single We Decor tenant (ADR-016).
- API resolves `OrgContext.tenantId` from authenticated user.
- All resources are tenant-scoped at the application layer and persistence layer (per `docs/08-data-model.md` and `docs/14-security-principles.md`).
- Cross-tenant missing resources return `404` (not `403`) to prevent information leakage (per API standards).

---

## Error Handling Standards

Use HTTP statuses and error envelope from `docs/18-api-standards.md`.

Recommended Phase 1 additional error codes:

- `CONCURRENT_MODIFICATION` (409): optimistic concurrency failure (`If-Match` mismatch)
- `DUPLICATE_REVIEW_REQUEST` (409): a ReviewRequest already exists for the Event (`eventId` unique)
- `SUGGESTION_NOT_ACTIONABLE` (409): suggestion not in `pending`
- `SUGGESTION_TARGET_MISMATCH` (409): suggestion does not map to the attempted action

---

## Validation Standards

Request validation:

- Validate request bodies with schemas at API boundary (see `docs/14-security-principles.md`)
- Money: logical domain Money is amount + currency; **wire JSON** follows OpenAPI (flat fields on most write DTOs; nested Money on some derived reads — see API Design Principles)
- Dates: `YYYY-MM-DD` for date, RFC3339 for datetime (`...Z`)
- Optional fields:
  - omitted on create
  - `null` clears on update

Business validation:

- Domain invariants from `docs/07-domain-model.md`
- Hard blocks from `docs/business/14-business-rules.md`
- Optimistic concurrency checks for updates (see below)

---

## Pagination / Search / Sorting / Filtering Standards

From `docs/18-api-standards.md`:

- Pagination: offset with `page` + `pageSize` (default `page=1`, `pageSize=20`, max `100`)
- Search: `?search=...` (full-text, tenant-scoped)
- Sorting: `?sortBy=field&sortOrder=asc|desc`
- Filtering: query params as filters, comma-separated multi-values, date ranges with `createdAfter/createdBefore`

---

## File Upload Strategy

Used for attachments linked to payments, inventory movement photos, vendor/expense proofs, and event content library.

Upload:

- `POST /api/v1/files/upload` with `multipart/form-data`
- Server validates MIME + size (default 10MB unless overridden by tenant config)
- Response returns attachment reference `attachmentId` (Attachment AR id)

Linking:

- State-changing endpoints accept `attachmentId` (or omit it)
- No file upload implementation inside business module endpoints

---

## Optimistic Concurrency Strategy

Applies to state-changing updates on existing aggregates.

- Aggregates include `version` (per `docs/08-data-model.md`)
- Client sends expected version in `If-Match: "<version>"`
- If mismatch: `409 CONCURRENT_MODIFICATION`

Create endpoints do not require `If-Match`.

---

## Suggestion Workflow (ADR-017)

Phase 1 handler contract:

- Handlers only create **Suggestions** and **in-app alerts**.
- Handlers must not auto-execute business actions.
- Execution happens only when a user accepts a pending suggestion.

Suggestion endpoints (Administration module):

- `GET /api/v1/suggestions?status=pending`
- `POST /api/v1/suggestions/:id/accept`
- `POST /api/v1/suggestions/:id/dismiss`

Suggestion types used in Phase 1 (from ADR-017 + domain model wiring):

- `workspace.create` (EP1-AUT-002)
- `checklist.generate` (EP1-AUT-003)
- `staff.assign` (EP1-AUT-004)

For Phase 1 inventory + vendor procurement workflow, business actions are human commands directly, not additional suggestion types.

---

## Sequence Diagrams (Mermaid)

### W5 Lead → Booking

```mermaid
sequenceDiagram
  actor Zakir as Zakir
  participant UI as Web UI
  participant API as Event OS API
  participant LeadSvc as LeadService
  participant DomainBus as Domain events
  participant SuggestionH as Suggestion-only handlers

  UI->>API: PATCH /api/v1/leads/{leadId}/stage (to approved)
  API->>LeadSvc: UpdateLeadStageCommand
  LeadSvc->>LeadSvc: Validate allowed transition + EP1-BR-001 gate
  LeadSvc->>DomainBus: Emit LeadStageChanged (+ conversion chain)
  DomainBus->>LeadSvc: Create/Link Customer + Quotation + Approved Event
  DomainBus->>SuggestionH: Create workspace.create suggestion (ADR-017)
  SuggestionH-->>API: Persist Suggestion (pending) + in-app alert
  API-->>UI: 200 (lead updated; event reference)
```

### W1 Approved Booking → Event Execution

```mermaid
sequenceDiagram
  actor Zakir as Zakir
  participant UI as Web UI
  participant API as Event OS API
  participant SuggestH as SuggestionService (accept)
  participant BookingSvc as BookingService / WorkspaceService
  participant SuggestionHandlers as Suggestion-only handlers

  UI->>API: POST /api/v1/suggestions/{id}/accept (workspace.create)
  API->>SuggestH: AcceptSuggestionCommand
  SuggestH->>BookingSvc: ActivateEventWorkspace (human-confirmed)
  BookingSvc-->>API: Workspace active
  BookingSvc->>SuggestionHandlers: emit events (within in-process bus)
  SuggestionHandlers-->>API: Persist checklist.generate + staff.assign suggestions + alerts
  API-->>UI: 200 (workspace active + suggestion ids)
```

### W2 Event Preparation → Inventory Movement

```mermaid
sequenceDiagram
  actor Zakir as Zakir
  participant UI as Web UI
  participant API as Event OS API
  participant SuggestH as SuggestionService (accept)
  participant TaskSvc as TaskService
  participant InvSuggest as Suggestion-only handlers
  participant InventorySvc as InventoryMovementService

  UI->>API: POST /api/v1/suggestions/{id}/accept (checklist.generate)
  API->>SuggestH: AcceptSuggestionCommand
  SuggestH->>TaskSvc: Generate packing/checklist draft
  TaskSvc-->>API: checklist draft + inventory movement planned suggestions
  UI->>API: POST /api/v1/inventory/movements/{movementId}/transition (to picked/packed/...)
  API->>InventorySvc: TransitionInventoryMovementCommand
  InventorySvc-->>API: movement state updated + timestamps
```

### W3 Event → Vendor Procurement

```mermaid
sequenceDiagram
  actor Zakir as Zakir
  participant UI as Web UI
  participant API as Event OS API
  participant VendorSvc as VendorProcurementService
  participant ProcLineSvc as ProcurementLineService

  UI->>API: POST /api/v1/bookings/{eventId}/procurements (create procurement plan)
  API->>VendorSvc: CreateVendorProcurementCommand
  API-->>UI: 201 procurement created
  UI->>API: POST /api/v1/procurements/{procId}/lines (add planned line)
  API->>VendorSvc: AddProcurementLineCommand (planned)
  UI->>API: POST /api/v1/procurement/lines/{lineId}/transition (to requested/confirmed/...)
  API->>ProcLineSvc: TransitionProcurementLineCommand
  API-->>UI: 200 line state updated + timestamps
```

### W4 Customer Payment → Financial Completion

```mermaid
sequenceDiagram
  actor Finance as Finance
  actor Zakir as Zakir
  participant UI as Web UI
  participant API as Event OS API
  participant PaymentSvc as PaymentService
  participant ExpenseSvc as ExpenseService
  participant BookingSvc as BookingService

  Finance->>API: POST /api/v1/payments (record advance/balance + proof)
  API->>PaymentSvc: RecordPaymentCommand
  PaymentSvc-->>API: payment recorded

  Finance->>API: POST /api/v1/bookings/{eventId}/expenses (record vendor expense + proof optional)
  API->>ExpenseSvc: RecordExpenseCommand
  ExpenseSvc-->>API: expense recorded

  Zakir->>API: POST /api/v1/bookings/{eventId}/complete
  API->>BookingSvc: CompleteBookingCommand
  BookingSvc-->>API: EP1-BR-002 enforced; event completed; KPIs refresh triggers
```

---

## Module: Lead Management

### Purpose

- Lead capture (all intake channels)
- Pipeline stage progression (New → In Talks → Approved → Completed)
- Lead assignment
- Structured follow-ups

### Application Services

- `LeadService`
- `FollowUpService`

### Primary aggregates

- `Lead` (aggregate root)
- `FollowUp` (owned entity)

### Related EP1 IDs

- EP1-SAL-001, EP1-SAL-002, EP1-SAL-003, EP1-SAL-004, EP1-SAL-005, EP1-SAL-006
- EP1-AUT-006 (conversion chain linkage)
- EP1-BR-001 (advance before Approved)

---

### REST Endpoints

#### Read

1. `GET /api/v1/leads`
- Required role: `owner`, `admin`, `sales_manager`, `sales`, `operations_manager`, `coordinator`, `finance`, `viewer`
- Expected permission: `leads:read`
- Primary aggregate: `Lead`
- Transaction boundary: read-only
- User approval required: No

2. `GET /api/v1/leads/:id`
- Required role: same as list
- Expected permission: `leads:read`
- Primary aggregate: `Lead`
- Transaction boundary: read-only
- User approval required: No

3. `GET /api/v1/leads/pipeline`
- Required role: `sales_manager`, `owner`, `admin`, `viewer`
- Expected permission: `leads:read`
- Primary aggregate: `Lead`
- Transaction boundary: read-only
- User approval required: No

#### State-changing

4. `POST /api/v1/leads`
- Required role: `sales_manager`, `sales`, `owner`, `admin`
- Expected permissions: `leads:write`
- Primary aggregate: `Lead`
- Transaction boundary: create Lead
- User approval required: No (explicit create by user)

Request model (body):
```json
{
  "source": "instagram|website|whatsapp|referral|walk_in|phone|other",
  "sourceDetail": "string|null",
  "eventType": "string",
  "eventDate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
  "venue": "string|null",
  "estimatedBudget": { "amount": 0, "currency": "INR" },
  "guestCount": 0,
  "notes": "string|null"
}
```

Command: `CreateLeadCommand`
Validation: matches EP1-SAL-002 taxonomy; date range valid; money amount non-negative.
Domain service: `LeadService.create()`
Domain event: `LeadCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "stage": "new", "assignedTo": null, "createdAt": "..." } }
```

5. `PATCH /api/v1/leads/:id/stage`
- Required role: `sales_manager`, `owner`, `admin`
- Expected permissions: `leads:stage:update`
- Primary aggregate: `Lead`
- Transaction boundary: Lead stage change + stage history (and conversion chain linkages if stage=approved)
- User approval required: Yes (explicit human command)

If-Match required for updates: yes.

Request model:
```json
{ "stage": "in_talks|approved|completed|lost|cancelled", "version": 1 }
```

Command: `UpdateLeadStageCommand`
Validation:
- allowed transition per `docs/07-domain-model.md`
- EP1-BR-001: if stage=approved, require advance payment exists for resulting Approved chain
- If-Match version check (optimistic concurrency)
Domain service: `LeadService.updateStage()`
Domain event: `LeadStageChanged` (and conversion chain linkage events)
Suggestion (ADR-017): `workspace.create` may be created after conversion to Approved event
Response:
```json
{ "data": { "leadId": "uuid", "stage": "approved", "eventId": "uuid|null" } }
```

6. `POST /api/v1/leads/:id/assign`
- Required role: `sales_manager`, `owner`, `admin`
- Expected permissions: `leads:assign`
- Primary aggregate: `Lead`
- Transaction boundary: update assigned staff + notification audit
- User approval required: Yes

Request model:
```json
{ "staffId": "uuid" }
```

Command: `AssignLeadCommand`
Validation: staff active; within tenant; lead stage assignable.
Domain service: `LeadService.assign()`
Domain event: `LeadAssigned`
Suggestion: none (assignment is human explicit)
Response:
```json
{ "data": { "id": "uuid", "assignedTo": "uuid" } }
```

7. `POST /api/v1/leads/:id/follow-ups`
- Required role: `sales_manager`, `sales`, `owner`, `admin`
- Expected permissions: `leads:followups:write`
- Primary aggregate: `FollowUp`
- Transaction boundary: create FollowUp for Lead
- User approval required: Yes (human sets reminder via command)

Request model:
```json
{
  "dueAt": "YYYY-MM-DDTHH:mm:ssZ",
  "notes": "string|null"
}
```

Command: `CreateFollowUpCommand`
Validation: dueAt is future/valid (implementation policy); lead exists.
Domain service: `FollowUpService.create()`
Domain event: `FollowUpCreated` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "leadId": "uuid", "dueAt": "..." } }
```

8. `PATCH /api/v1/follow-ups/:id`
- Required role: `sales_manager`, `sales`, `owner`, `admin`
- Expected permissions: `leads:followups:write`
- Primary aggregate: `FollowUp`
- Transaction boundary: update FollowUp (status/due date)
- User approval required: Yes

If-Match for updates: yes.

Request model:
```json
{
  "status": "pending|done|cancelled",
  "dueAt": "YYYY-MM-DDTHH:mm:ssZ|null",
  "comment": "string|null",
  "version": 1
}
```

Command: `UpdateFollowUpCommand`
Validation: follow-up belongs to tenant; allowed transitions.
Domain service: `FollowUpService.update()`
Domain event: `FollowUpUpdated` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "done" } }
```

---

## Module: Customer

### Purpose

- Customer profile management
- Communication timeline (per event) — CRM `TimelineEntry` via `/interactions`
- Lightweight issue notes (per event)
- Review request tracking (per event)
- **P2-11 Customer 360°** — read-only relationship intelligence (overview, unified timeline, bookings, relationship, financial summary, communications) under `/clients/:customerId/...`

### Application Services

- `CustomerService` / `CustomerApplicationService`
- `TimelineService` / `TimelineApplicationService`
- `IssueService` / `IssueApplicationService`
- `ReviewRequestService` / `ReviewRequestApplicationService`
- `CustomerIntelligenceApplicationService` (P2-11) — read-only aggregation; no mutations

### Primary aggregates

- `Customer` (CRM client)
- `TimelineEntry`
- `IssueNote`
- `ReviewRequest`
- Read models only (P2-11): `CustomerOverviewDto`, `CustomerTimelineItemDto`, `CustomerBookingHistoryItemDto`, `CustomerRelationshipDto`, `CustomerFinancialSummaryDto`, `CustomerCommunicationsSummaryDto`

### Related EP1 IDs

- EP1-CUS-001, EP1-CUS-002, EP1-CUS-003, EP1-CUS-004
- EP1-SUP-001–003 (aliases)

---

### REST Endpoints

Reads:

1. `GET /api/v1/clients` (list) — **not shipped in Phase 1**
- Status: deferred (no controller route). Use `GET /clients/:id` for single-client reads.
- Expected permissions (when shipped): `clients:read`

2. `GET /api/v1/clients/:id`
- Required role: roles holding `clients:read` (see matrix)
- Expected permissions: `clients:read`
- Primary aggregate: `Customer`
- Transaction boundary: read-only
- User approval required: No

Timeline:

3. `GET /api/v1/clients/:customerId/interactions`
- Required role: roles holding `timeline:read` (see matrix)
- Expected permissions: `timeline:read`
- Primary aggregate: `TimelineEntry` (table `client_interactions`)
- Transaction boundary: read-only
- User approval required: No

#### Customer 360 (P2-11 — read-only aggregation)

All routes are nested under HTTP resource **`clients`** (UI: Customers). Permission: reuse **`clients:read`** — no new intelligence permission. No Prisma migration. `WorkspaceDto` unchanged (Workspace stays booking-centric; Customer 360 is customer-centric).

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/clients/:customerId/overview` | `clients:read` | Profile, contacts, interaction window, active bookings, health, deep links (calendar / communications / finance) |
| GET | `/api/v1/clients/:customerId/timeline` | `clients:read` | Chronological multi-source timeline; optional `from` / `to` (`datetime`) and `sources` (comma-separated) |
| GET | `/api/v1/clients/:customerId/bookings` | `clients:read` | Booking history with workspace + calendar deep links |
| GET | `/api/v1/clients/:customerId/relationship` | `clients:read` | Repeat flag, lifetime counts, preferred channel / event types, health + indicators |
| GET | `/api/v1/clients/:customerId/financial-summary` | `clients:read` | Quoted / invoiced / paid / outstanding + document list |
| GET | `/api/v1/clients/:customerId/communications` | `clients:read` | Channel usage, recent records, reminder counters |

Timeline sources: `lead`, `follow_up`, `quotation`, `booking`, `event_milestone`, `communication`, `payment` (includes invoice items), `financial_document`, `timeline_entry`, `reminder`.

Aggregation notes:

- **Financial:** `totalQuoted` excludes `superseded` / `rejected`; `totalInvoiced` excludes `void`; `totalPaid` = confirmed payments rolled up via bookings (`Payment` has no `customerId`); `outstandingBalance = max(0, invoiced − paid)`
- **Relationship health (rule-based):** `follow_up_required` → `active` → `returning` → `dormant` (≥180 days) → else `active`; no AI scoring
- **Follow-ups:** lead-scoped via `FollowUpRepository.findByLeadIds`
- Controller: `CustomerIntelligenceController` `@Controller('clients/:customerId')`

State-changing:

4. `POST /api/v1/clients`
- Required role: `sales_manager`, `operations_manager`, `owner`, `admin`
- Expected permissions: `clients:write`
- Primary aggregate: `Customer`
- Transaction boundary: create Customer (+ initial contact if provided)
- User approval required: Yes (human command)

Command: `CreateCustomerCommand`
Validation: tenant scoped; contact reachability if provided.
Domain service: `CustomerService.create()`
Domain event: `ClientCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "name": "string", "status": "active" } }
```

Request model:
```json
{ "name": "string", "type": "individual|organization", "notes": "string|null" }
```

5. `PATCH /api/v1/clients/:id`
- Required role: `operations_manager`, `sales_manager`, `owner`, `admin`
- Expected permissions: `clients:write`
- Primary aggregate: `Customer`
- Transaction boundary: update Customer profile
- User approval required: Yes

If-Match for updates: yes.

Command: `UpdateCustomerCommand`
Validation: tenant scoped; uniqueness constraints handled by domain (if applicable).
Domain service: `CustomerService.update()`
Domain event: `ClientUpdated`
Suggestion: none
Response: updated client

Request model:
```json
{ "name": "string|null", "notes": "string|null", "version": 1 }
```

6. `POST /api/v1/clients/:customerId/contacts`
- Required role: roles holding `clients:write` (see matrix)
- Expected permissions: `clients:write`
- Primary aggregate: `Customer` (owned Contact entities)
- Transaction boundary: add contact to customer
- User approval required: Yes
- Note: create-only in Phase 1 (no GET/PATCH/DELETE contact routes)

Command: `AddContactCommand`
Validation: at least one reachable phone/email; normalize phone/email.
Domain service: `CustomerService.addContact()` / `ContactApplicationService.create()`
Domain event: `ContactAdded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "contactsCount": 2 } }
```

Request model:
```json
{ "name": "string", "role": "string", "phone": { "countryCode": "+91", "number": "9876543210" }, "email": { "value": "x@y.com" } }
```

7. `POST /api/v1/clients/:customerId/interactions`
- Required role: roles holding `timeline:write` (see matrix)
- Expected permissions: `timeline:write`
- Primary aggregate: `TimelineEntry` (table `client_interactions`)
- Transaction boundary: append timeline entry
- User approval required: Yes
- Note: `recordedByUserId` is taken from the authenticated user — never from the body

Command: `LogTimelineEntryCommand`
Validation: referenced `eventId` belongs to tenant; message non-empty.
Domain service: `TimelineService.log()` / `TimelineApplicationService`
Domain event: `TimelineEntryAdded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "eventId": "uuid", "type": "note" } }
```

Request model:
```json
{ "eventId": "uuid", "type": "note|issue|other", "message": "string", "occurredAt": "YYYY-MM-DDTHH:mm:ssZ" }
```

8. `POST /api/v1/events/:eventId/issues`
- Required role: roles holding `issues:write` (`owner`, `admin`, `operations_manager`, `coordinator` — see matrix)
- Expected permissions: `issues:write`
- Primary aggregate: `IssueNote`
- Transaction boundary: create issue note linked to Event + Customer
- User approval required: Yes
- Note: `customerId` is derived from the Event — never accepted in the body. Create-only (no resolve/PATCH).

Command: `CreateIssueNoteCommand`
Validation: event belongs to tenant; message non-empty.
Domain service: `IssueApplicationService.create()`
Domain event: `IssueNoteCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "eventId": "uuid", "status": "open" } }
```

Request model:
```json
{ "message": "string", "severity": "low|medium|high", "notes": "string|null" }
```

9. `POST /api/v1/events/:eventId/review-requests`
- Required role: roles holding `reviews:write` (`owner`, `admin`, `sales_manager` only — **not** `operations_manager`; see matrix)
- Expected permissions: `reviews:write`
- Primary aggregate: `ReviewRequest`
- Transaction boundary: create review request record for Event
- User approval required: Yes
- Note: `customerId` is derived from the Event. At most one ReviewRequest per Event (`eventId` unique); duplicates → `409 DUPLICATE_REVIEW_REQUEST`. Create-only (no send/acknowledge).

Command: `CreateReviewRequestCommand(eventId, channel)`
Validation: Event belongs to tenant; timing not predefined by business (accept human decision).
Domain service: `ReviewRequestApplicationService.create()`
Domain event: `ReviewRequestCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "eventId": "uuid", "status": "pending" } }
```

Request model:
```json
{ "channel": "google|instagram|other", "channelDetail": "string|null" }
```

---

## Module: Quotation

### Purpose

- Create and manage quotations (with line items)
- Send quotation (human command)
- Approve/reject/revise quotation (human command)

### Application Services

- `QuotationService`
- `QuotationLineItemService`
- `QuotationPdfService` (logical)

### Primary aggregates

- `Quotation`
- `QuotationLineItem`

### Related EP1 IDs

- EP1-FIN-001
- EP1-AUT-006 (approved chain links to Event)

---

### REST Endpoints

Reads:

1. `GET /api/v1/quotations` — **not shipped in Phase 1 OpenAPI**
- Status: absent from frozen contract (same class as `GET /clients` list)
- Admin Portal: **hub-when-no-list** — open quotation by id (`/app/quotations/view/?id=`)

2. `GET /api/v1/quotations/:id`
- Role/perm: `quotations:read`
- Primary: `Quotation`
- Note: Phase 1 GET returns **header + server totals**; line items are **not embedded**. Line-item mutate routes exist (`POST/PATCH/DELETE …/line-items`) but Admin Portal F1-07 deferred line-item UI until a read/embed path exists.

3. `GET /api/v1/quotations/:id/pdf` — **not shipped in Phase 1 OpenAPI**
- Status: deferred (no PDF endpoint in freeze)
- Permission (when shipped): `quotations:read`

State-changing:

4. `POST /api/v1/quotations`
- Role: `sales_manager`, `sales`, `owner`, `admin`
- Permission: `quotations:write`
- Primary: `Quotation`
- Transaction boundary: create quotation + header fields
- Approval required: Yes (human command)

Request:
```json
{
  "leadId": "uuid",
  "customerId": "uuid",
  "validUntil": "YYYY-MM-DD|null",
  "notes": "string|null"
}
```
Note: frozen OpenAPI create body is **`customerId` + `leadId`** (required), not `clientId`. Extra commercial fields in older samples are not on the Phase 1 create contract.

Command: `CreateQuotationCommand`
Validation: tenant scoped; valid dates; cannot create in non-draft (domain).
Domain service: `QuotationService.create()`
Domain event: `QuotationCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "draft", "version": 1 } }
```

5. `PATCH /api/v1/quotations/:id`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:write`
- Primary: `Quotation`
- Transaction boundary: update editable fields (draft only)
- Approval required: Yes (human command)

If-Match: required.
Command: `UpdateQuotationCommand`
Validation: quotation editable (domain); valid transitions.
Domain service: `QuotationService.update()`
Domain event: `QuotationUpdated` (optional)
Suggestion: none
Response: updated quotation (draft)

Request:
```json
{ "terms": "string|null", "notes": "string|null", "version": 1 }
```

6. `POST /api/v1/quotations/:id/line-items`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:write`
- Primary: `QuotationLineItem`
- Transaction boundary: add line item to quotation (draft only)
- Approval required: Yes

Command: `AddQuotationLineItemCommand`
Validation: quotation is draft; line item fields valid; Money non-negative.
Domain service: `QuotationLineItemService.add()`
Domain event: `QuotationLineItemAdded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "quotationId": "uuid" } }
```

Request:
```json
{
  "description": "string",
  "packageId": "uuid|null",
  "quantity": 1,
  "unitPrice": { "amount": 10000, "currency": "INR" },
  "sortOrder": 0
}
```

7. `PATCH /api/v1/quotations/:id/line-items/:itemId`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:write`
- Primary: `QuotationLineItem`
- Transaction boundary: update line item (draft only)
- Approval required: Yes

If-Match: required.
Command: `UpdateQuotationLineItemCommand`
Validation: quotation editable; unit price non-negative.
Domain service: `QuotationLineItemService.update()`
Domain event: `QuotationLineItemUpdated`
Suggestion: none
Response: updated line

Request:
```json
{ "quantity": 2, "unitPrice": { "amount": 12000, "currency": "INR" }, "version": 1 }
```

8. `DELETE /api/v1/quotations/:id/line-items/:itemId`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:write`
- Primary: `QuotationLineItem`
- Transaction boundary: soft delete line item (draft only)
- Approval required: Yes

Command: `RemoveQuotationLineItemCommand`
Validation: quotation editable as draft
Domain service: `QuotationLineItemService.remove()`
Domain event: `QuotationLineItemRemoved` (optional)
Suggestion: none
Response:
```json
{ "data": { "itemId": "uuid", "deleted": true } }
```

9. `POST /api/v1/quotations/:id/send`
- Role: `sales_manager`, `sales`, `owner`, `admin`
- Permission: `quotations:send`
- Primary: `Quotation`
- Transaction boundary: set sent and store send context
- Approval required: Yes

Command: `SendQuotationCommand`
Validation: quotation can be sent (domain); has at least 1 line.
Domain service: `QuotationService.send()`
Domain event: `QuotationSent`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "sent", "sentAt": "..." } }
```

Request:
```json
{}
```
Note: frozen OpenAPI `send` body is empty; channel/recipient are **not** on the Phase 1 contract. Admin Portal confirms send only.

10. `POST /api/v1/quotations/:id/approve`
- Role: `sales_manager`, `operations_manager`, `owner`, `admin`
- Permission: `quotations:approve`
- Primary: `Quotation`
- Transaction boundary: approve + conversion linkage to Approved Event chain
- Approval required: Yes

Command: `ApproveQuotationCommand`
Validation: quotation approvable + not expired; optimistic concurrency if required.
Domain service: `QuotationService.approve()`
Domain event: `QuotationApproved`
Suggestion (ADR-017): `workspace.create` may be created by handlers (EP1-AUT-002)
Response:
```json
{ "data": { "id": "uuid", "status": "approved", "eventId": "uuid|null" } }
```

11. `POST /api/v1/quotations/:id/reject`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:reject`
- Primary: `Quotation`
- Transaction boundary: set rejected
- Approval required: Yes

Command: `RejectQuotationCommand`
Validation: quotation rejectable by domain rules.
Domain service: `QuotationService.reject()`
Domain event: `QuotationRejected`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "rejected" } }
```

12. `POST /api/v1/quotations/:id/revise`
- Role: `sales_manager`, `owner`, `admin`
- Permission: `quotations:revise`
- Primary: `Quotation`
- Transaction boundary: supersede current + create new draft version
- Approval required: Yes

Command: `ReviseQuotationCommand`
Validation: quotation revisionable by domain invariant
Domain service: `QuotationService.revise()`
Domain event: `QuotationSuperseded` (+ `QuotationCreated` for new draft)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "draft", "version": 2 } }
```

---

## Module: Booking (Event Hub)

### Purpose

- Unified event record control (status, cancellation, completion)
- Execution ownership + execution milestone advance enforcement (EP1-BR-003)
- Completion enforcement (EP1-BR-002)

### Application Services

- `BookingService`
- `ExecutionProgressService`

### Primary aggregates

- `Event` (Booking)
- `ExecutionProgress`

### Related EP1 IDs

- EP1-OPS-001, EP1-OPS-004, EP1-OPS-005
- EP1-BR-002, EP1-BR-003
- EP1-AUT-002 (workspace create suggestion is linked from earlier chain)

---

### REST Endpoints

Reads:

1. `GET /api/v1/bookings` — **not shipped in Phase 1 OpenAPI**
- Status: absent from frozen contract
- Admin Portal: **hub-when-no-list** — open booking by id; bookings appear after quotation approve (advance confirmed)

2. `GET /api/v1/bookings/:id`
- Role/perm: `bookings:read`
- Primary: `Event` (HTTP resource name: booking)
- Approval required: No

State-changing:

3. `PATCH /api/v1/bookings/:id/status`
- Role: `operations_manager`, `coordinator`, `finance`, `owner`, `admin`
- Permission: `bookings:status:update`
- Primary: `Event`
- Transaction boundary: status update + relevant timestamps
- User approval required: Yes

If-Match required.

Command: `UpdateBookingStatusCommand`
Validation: status transition allowed; EP1-BR-003 enforcement for execution stage advance crossings.
Domain service: `BookingService.updateStatus()`
Domain event: `BookingStatusChanged`
Suggestion (ADR-017): if status change triggers downstream assistance, handlers may create suggestions/alerts; Phase 1 handlers do not auto-execute.
Response:
```json
{ "data": { "id": "uuid", "status": "in_preparation|in_execution|completed|cancelled" } }
```

Request:
```json
{ "status": "in_preparation|in_execution|completed|cancelled", "version": 1 }
```

4. `POST /api/v1/bookings/:id/cancel`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `bookings:cancel`
- Primary: `Event`
- Transaction boundary: set cancelled + cleanup triggers (tasks/movements cancellation via domain events)
- User approval required: Yes

Command: `CancelBookingCommand(bookingId, reason)`
Validation: allowed cancellation rules (domain); reason required if domain requires.
Domain service: `BookingService.cancel()`
Domain event: `BookingCancelled`
Suggestion: none (cancellation is direct human command)
Response:
```json
{ "data": { "id": "uuid", "status": "cancelled" } }
```

Request:
```json
{ "reason": "string" }
```

5. `POST /api/v1/bookings/:id/complete`
- Role: `finance`, `operations_manager`, `owner`, `admin`
- Permission: `bookings:complete`
- Primary: `Event`
- Transaction boundary: enforce EP1-BR-002 + mark completed
- User approval required: Yes

If-Match optional when updating existing record (implementation).
Command: `CompleteBookingCommand`
Validation: EP1-BR-002 (financial review) satisfied.
Domain service: `BookingService.complete()`
Domain event: `EventCompleted`
Suggestion: none required for Completed; KPI read models refresh may be triggered asynchronously but not auto-executing business actions.
Response:
```json
{ "data": { "id": "uuid", "status": "completed", "completedAt": "..." } }
```

6. `POST /api/v1/bookings/:id/execution-stages/advance`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `bookings:execution:advance`
- Primary: `ExecutionProgress`
- Transaction boundary: update execution progress + stage/milestone timestamps
- User approval required: Yes

Command: `AdvanceExecutionStageCommand(bookingId, milestoneKey, preparationStatus?)`
Validation: EP1-BR-003 satisfied (execution ownership assigned); milestoneKey accepted (tenant config; API treats as string key).
Domain service: `ExecutionProgressService.advance()`
Domain event: `ExecutionProgressAdvanced`
Suggestion: none (direct human advance)
Response:
```json
{ "data": { "bookingId": "uuid", "preparationStatus": "ready|pending|needs_attention" } }
```

Request:
```json
{ "milestoneKey": "string", "preparationStatus": "pending|ready|needs_attention" }
```

---

## Module: Event Workspace

### Purpose

- Present **thin** operational workspace status for an approved event (Phase 1 OpenAPI)
- Phase 1 `GET …/workspace` returns workspace/preparation status + execution owner only — **not** embedded tasks, staff, procurement, inventory, or finance collections
- Cross-module ops data is accessed via **booking-scoped** endpoints (payments, expenses, inventory-movements, procurements, etc.) and Admin Portal deep-links (F1-08–F1-13)
- **P2-01** adds additive read endpoints for computed progress and activity feed, plus internal notes — without expanding the thin `WorkspaceDto`

Workspace activation follows ADR-017's approval-gate rule for Execution-category actions: it
**requires either manual initiation or accepted suggestion** — handlers alone cannot complete it.
Phase 1 supports two valid entry points into the identical use case:

- **Direct human command** — `POST /api/v1/bookings/:id/activate-workspace` (primary path used by Admin Portal F1-09; does not
  depend on the Suggestion subsystem)
- **Suggestion acceptance** — `POST /api/v1/suggestions/:id/accept` (`workspace.create`); optional,
  available once the Suggestion subsystem exists (Admin Portal deferred suggestion UX)

Both entry points **MUST** invoke the identical `WorkspaceService.activateWorkspace()` /
`BookingApplicationService.activateWorkspace()` use case, per ADR-017's single-execution-path
principle ("Accepting a suggestion calls the same use case as a manual user action") — suggestion
acceptance never re-implements or diverges from the direct command's business logic.

### Application Services

- `WorkspaceQueryService` (read)
- `WorkspaceService.activateWorkspace()` — the single execution path for workspace activation,
  invoked either directly via `POST /api/v1/bookings/:id/activate-workspace` or via an accepted
  `workspace.create` suggestion
- `WorkspaceProgressService.getProgress()` — P2-01/P2-02 computed progress (tasks, event checklists preferred over task checklist items, inventory buckets, pending actions)
- `WorkspaceActivityService.listActivity()` — P2-01 read-only activity aggregation from booking-scoped facts
- `EventNoteApplicationService` — P2-01 internal operational notes (not customer-visible)

### Primary aggregates

- `Event` (workspace owner)
- Links to owned entities created in other modules

### Related EP1 IDs

- EP1-OPS-001, EP1-AUT-002, EP1-OPS-004

---

### REST Endpoints

1. `GET /api/v1/bookings/:id/workspace`
- Role: `viewer` (read) + module roles
- Permission: `workspace:read`
- Primary: `Event` (+ linked view)
- Transaction boundary: read-only
- User approval required: No

Response model:
```json
{
  "data": {
    "eventId": "uuid",
    "workspaceStatus": "inactive|active|archived",
    "preparationStatus": "pending|ready|needs_attention",
    "executionOwnerId": "uuid|null"
  }
}
```

2. `POST /api/v1/bookings/:id/activate-workspace`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `workspace:activate`
- Primary: `Event`
- Transaction boundary: set `workspaceStatus` active + execution progress defaults
- User approval required: Yes (explicit human command per ADR-017)

If-Match: required.
Command: `ActivateWorkspaceCommand`
Validation: booking exists; status is approved or in_preparation; workspace not already active.
Domain service: `WorkspaceService.activateWorkspace()`
Domain event: `WorkspaceActivated`
Suggestion (ADR-017): this is the direct/manual entry point. If a pending `workspace.create`
suggestion exists for this booking, accepting it via `POST /api/v1/suggestions/:id/accept` invokes
this same `WorkspaceService.activateWorkspace()` method — both paths share one execution path and
neither depends on the other.
Response:
```json
{
  "data": {
    "eventId": "uuid",
    "workspaceStatus": "active",
    "preparationStatus": "pending|ready|needs_attention",
    "executionOwnerId": "uuid|null"
  }
}
```

3. `GET /api/v1/bookings/:id/workspace/progress` (P2-01)
- Permission: `workspace:read`
- Computed completion %, task/checklist counts, pending actions, inventory status buckets; **P2-08** additive `financeDocuments` counters; **P2-09** additive `communications` counters (total / failed / pendingReminders / overdueReminders / outstandingActions)
- Does **not** change thin `GET …/workspace`

4. `GET /api/v1/bookings/:id/workspace/activity` (P2-01)
- Permission: `workspace:read`
- Chronological activity feed aggregated from booking, tasks, staff, vendors, inventory, payments, notes; **P2-08** includes `document_*` events; **P2-09** includes `communication_created` / `communication_sent` / `communication_delivered` / `communication_read` / `communication_failed` and `reminder_created` / `reminder_completed` / `reminder_cancelled`

5. `GET /api/v1/bookings/:id/notes` / `POST /api/v1/bookings/:id/notes` / `DELETE /api/v1/bookings/:id/notes/:noteId` (P2-01)
- Permissions: `workspace:read` (list), `workspace:notes:write` (create/delete)
- Internal operational notes (`EventNote`) — distinct from customer `TimelineEntry`

---

## Module: Task Management

### Purpose

- Human-managed tasks and task-owned checklist items
- Reusable checklist templates / event checklist generation live under Checklist Management (P2-02); suggestion type `checklist.generate` remains the approval gate (ADR-017)

### Application Services

- `TaskService`

### Primary aggregates

- `Task`
- `ChecklistItem` (owned)

### Related EP1 IDs

- EP1-OPS-003, EP1-AUT-003

---

### REST Endpoints

Reads:

1. `GET /api/v1/tasks?bookingId=...`
- Role: `viewer` + module roles
- Permission: `tasks:read`
- Primary: `Task`
- Approval required: No

2. `GET /api/v1/tasks/:id`
- Role/perm: `tasks:read`

State-changing:

3. `POST /api/v1/tasks`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `tasks:write`
- Primary: `Task`
- Transaction boundary: create task linked to booking/event
- Approval required: Yes (user command)

Request:
```json
{ "bookingId": "uuid", "title": "string", "description": "string|null", "assignedTo": "uuid|null", "dueAt": "datetime|null" }
```

Command: `CreateTaskCommand`
Validation: booking belongs to tenant; assignedTo is valid staff (if provided).
Domain service: `TaskService.create()`
Domain event: `TaskCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "pending" } }
```

4. `PATCH /api/v1/tasks/:id`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `tasks:write`
- Primary: `Task`
- Transaction boundary: update task fields
- Approval required: Yes

If-Match required.
Command: `UpdateTaskCommand`
Validation: task belongs to tenant; transitions allowed.
Domain service: `TaskService.update()`
Domain event: `TaskUpdated` (optional)
Suggestion: none
Response: updated task

Request:
```json
{ "title": "string|null", "description": "string|null", "dueAt": "datetime|null", "version": 1 }
```

5. `PATCH /api/v1/tasks/:id/status`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `tasks:status:update`
- Primary: `Task`
- Transaction boundary: update status + completed timestamps
- Approval required: Yes

If-Match required.
Command: `UpdateTaskStatusCommand`
Validation: transitions allowed.
Domain service: `TaskService.updateStatus()`
Domain event: `TaskCompleted` (if completed)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "completed" } }
```

Request:
```json
{ "status": "pending|in_progress|completed|cancelled", "version": 1 }
```

---

## Module: Checklist Management (P2-02)

### Purpose

- Reusable checklist templates and event-specific checklist execution
- Templates remain reusable; generated event checklists are independent copies
- Packing/execution checklist generation via `POST /event-checklists/generate` or suggestion accept `checklist.generate`

### Application Services

- `ChecklistTemplateApplicationService`
- `EventChecklistApplicationService`

### Primary aggregates

- `ChecklistTemplate` / `ChecklistTemplateItem`
- `EventChecklist` / `EventChecklistItem`

### Related EP1 IDs

- EP1-OPS-003, EP1-AUT-003

---

### REST Endpoints

Templates:

1. `GET /api/v1/checklist-templates?status=active`
- Permission: `checklists:read`
- Primary: `ChecklistTemplate`

2. `GET /api/v1/checklist-templates/:id`
- Permission: `checklists:read`

3. `GET /api/v1/checklist-templates/:id/versions`
- Permission: `checklists:read`
- Version history under `rootTemplateId`

4. `POST /api/v1/checklist-templates`
- Permission: `checklists:write`
- Creates an active template (`templateVersion` 1)

5. `PATCH /api/v1/checklist-templates/:id`
- Permission: `checklists:write`
- Optimistic concurrency via `If-Match`

6. `POST /api/v1/checklist-templates/:id/archive`
- Permission: `checklists:write`
- Soft-archive (no hard delete when used)

7. `POST /api/v1/checklist-templates/:id/duplicate`
- Permission: `checklists:write`
- Creates next `templateVersion` under same `rootTemplateId`

8. `POST /api/v1/checklist-templates/:id/items` / `PATCH .../items/:itemId` / `DELETE .../items/:itemId`
- Permission: `checklists:write`
- Item delete blocked when template has generated event checklists

Event checklists:

9. `GET /api/v1/event-checklists?bookingId=...`
- Permission: `checklists:read`
- Primary: `EventChecklist` with items

10. `POST /api/v1/event-checklists/generate`
- Permission: `checklists:write`
- Body: `{ "bookingId": "uuid", "templateIds?: uuid[]" }`
- Matches active templates by event type when `templateIds` omitted; skips already-generated pairs

11. `GET /api/v1/event-checklists/:id`
- Permission: `checklists:read`

12. `PATCH /api/v1/event-checklists/:id/items/:itemId`
- Permission: `checklists:execute`
- Body: `{ "isCompleted?: boolean", "notes?: string|null" }`
- Sets `completedAt` / `completedByUserId` on complete; clears on undo

---

## Module: Staff Management

### Purpose

- Staff master management (decorator workforce) — operational StaffMember aggregate
- Event assignment via StaffMember id (`staffMemberId`); optional legacy User bridge during expand-contract
- Staff assignment confirmation for events is also reachable via `staff.assign` suggestion acceptance (ADR-017)
- P2-05 scheduling: availability, leave, conflict detection, workload, calendar, rule-based recommendations — all keyed by StaffMember

### Application Services

- `StaffService`
- `StaffAvailabilityApplicationService`
- `StaffLeaveApplicationService`
- `SchedulingApplicationService`

### Primary aggregates

- `StaffMember` (owns availability + leave entities; assignments remain Event-scoped)

### Related EP1 IDs

- EP1-STF-001, EP1-STF-002, EP1-STF-003, EP1-AUT-004

---

### REST Endpoints

Reads:

1. `GET /api/v1/staff`
- Role: `operations_manager`, `viewer`, `owner`, `admin`
- Permission: `staff:read`
- Primary: `StaffMember`
- Approval required: No

2. `GET /api/v1/staff/:id`
- Same permissions

State-changing:

3. `POST /api/v1/staff`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `staff:write`
- Primary: `StaffMember`
- Transaction boundary: create staff member
- Approval required: Yes

Command: `CreateStaffMemberCommand`
Validation: tenant scoped; required fields.
Domain service: `StaffService.create()`
Domain event: `StaffMemberCreated` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "active" } }
```

Request:
```json
{
  "name": "string",
  "role": "string",
  "department": "string|null",
  "phone": { "countryCode": "+91", "number": "9876543210" },
  "email": { "value": "x@y.com" } ,
  "status": "active|inactive|on_leave"
}
```

4. `PATCH /api/v1/staff/:id`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `staff:write`
- Primary: `StaffMember`
- Transaction boundary: update staff member fields
- Approval required: Yes

If-Match required.
Command: `UpdateStaffMemberCommand`
Validation: staff rules from `docs/business/06-staff-management.md` (v1.0 approved).
Domain service: `StaffService.update()`
Domain event: `StaffMemberUpdated` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "active" } }
```

Request:
```json
{ "status": "active|inactive|on_leave", "version": 1 }
```

Staff event assignment:

- executed via `POST /api/v1/suggestions/:id/accept` (suggestion type `staff.assign`)
- see Administration module suggestion acceptance for details
- Confirm (`POST /staff-assignments/:id/confirm`) runs scheduling conflict detection (overlapping confirmed assignments, approved leave, unavailable/holiday/partial_day availability). Conflicts return `SCHEDULING_CONFLICT`.

### P2-05 Scheduling APIs (additive)

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/staff-availability?staffMemberId=` | `staff:read` | List availability |
| POST | `/api/v1/staff-availability` | `staff:write` | Create (date **or** weekday) |
| PATCH | `/api/v1/staff-availability/:id` | `staff:write` | If-Match |
| DELETE | `/api/v1/staff-availability/:id` | `staff:write` | |
| GET | `/api/v1/staff-leave?staffMemberId=` | `staff:read` | Optional `status` |
| POST | `/api/v1/staff-leave` | `staff:write` | Request leave |
| POST | `/api/v1/staff-leave/:id/review` | `staff:write` | approve / reject / cancel; If-Match |
| GET | `/api/v1/scheduling/calendar?from=&to=` | `staff:read` | Optional `staffMemberId`, `view` |
| GET | `/api/v1/scheduling/workload` | `staff:read` | Optional `staffMemberId` |
| GET | `/api/v1/scheduling/conflicts` | `staff:read` | `staffMemberId` + `bookingId` |
| GET | `/api/v1/scheduling/recommendations?bookingId=` | `staff:read` | Rule-based ranking only |

---

## Module: Vendor Procurement

### Purpose

- Vendor master
- Per-event procurement workflow (P2-06 header lifecycle + Phase 1 line FSM):
  - Header: draft → quotation_requested → quotation_received → approved → purchase_ordered → vendor_confirmed → materials_delivered → completed / cancelled
  - Lines: planned → requested → confirmed → delivered/completed (+ cancelled)
- Cost variance recording support as required (EP1-VEN-005)
- Quotes, purchase orders (no PDF), delivery tracking, timeline, cost summary
- Lightweight issue notes at vendor and procurement-line level (Phase 1)

### Application Services

- `VendorService`
- `VendorProcurementService` (workflow, quotes, POs, delivery, cost)
- `ProcurementLineService`

### Additive P2-06 endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/vendor-procurements` | Tenant list |
| GET | `/api/v1/vendor-procurements/:id` | Detail + quotes/POs/timeline/cost |
| POST | `/api/v1/vendor-procurements/:id/transition` | Header workflow; If-Match |
| POST | `/api/v1/vendor-procurements/:id/delivery` | Delivery status |
| POST | `/api/v1/vendor-procurements/:id/quotes` | Add quote |
| POST | `/api/v1/procurement-quotes/:id/approve` | Approve quote |
| POST | `/api/v1/vendor-procurements/:id/purchase-orders` | Create/issue PO |

Booking-scoped `GET/POST /bookings/:id/procurements` remain the workspace entry points (backward compatible).

### Primary aggregates

- `Vendor`
- `VendorProcurement`
- `ProcurementLine` (owned under VendorProcurement)
- `ProcurementQuote` / `PurchaseOrder` / `ProcurementTimelineEvent` (P2-06)
- `VendorIssueNote` / `ProcurementLineIssueNote` (where applicable)

### Related EP1 IDs

- EP1-VEN-001–EP1-VEN-006
- EP1-INV-002–not applicable (inventory separate)

---

### REST Endpoints

Vendor master:

1. `GET /api/v1/vendors`
- Role: `operations_manager`, `viewer`, `owner`, `admin`
- Permission: `vendors:read`
- Primary: `Vendor`
- Approval required: No

2. `POST /api/v1/vendors`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `vendors:write`
- Primary: `Vendor`
- Transaction boundary: create vendor
- Approval required: Yes

Command: `CreateVendorCommand`
Validation: required vendor fields; category mapping from `docs/business/07-vendor-management.md` (phase 1 facts)
Domain service: `VendorService.create()`
Domain event: `VendorCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "active" } }
```

Request:
```json
{ "name": "string", "category": "string", "contacts": "object|null", "status": "active|inactive" }
```

3. `PATCH /api/v1/vendors/:id`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `vendors:write`
- Primary: `Vendor`
- Transaction boundary: update vendor
- Approval required: Yes

If-Match required.

Command: `UpdateVendorCommand(vendorId, payload)`
Validation:
- vendor belongs to tenant
- provided fields are valid (name/category/status and optional contact updates)
Domain service: `VendorService.update()`
Domain event: `VendorUpdated`
Suggestion: none
Response model:
```json
{ "data": { "id": "uuid", "name": "string", "status": "active|inactive" } }
```
Request model:
```json
{ "name": "string|null", "category": "string|null", "status": "active|inactive", "version": 1 }
```

4. `GET /api/v1/vendors/:id`
- Role/perm: `vendors:read`

Per-event procurement:

5. `GET /api/v1/bookings/:id/procurements`
- Role: `operations_manager`, `finance`, `viewer`, `owner`, `admin`, `coordinator`
- Permission: `procurements:read`
- Primary: `VendorProcurement`
- Approval required: No

6. `POST /api/v1/bookings/:id/procurements`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `procurements:write`
- Primary: `VendorProcurement`
- Transaction boundary: create VendorProcurement header linked to Event
- Approval required: Yes

Command: `CreateVendorProcurementCommand(bookingId, vendorAssignments?)`
Validation: booking belongs to tenant; workspace activation may be required by domain invariant (if enforced).
Domain service: `VendorProcurementService.create()`
Domain event: `VendorProcurementCreated` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "bookingId": "uuid", "status": "planned" } }
```

Request:
```json
{ "vendorId": "uuid", "notes": "string|null" }
```

7. `POST /api/v1/procurements/:id/lines`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `procurements:write`
- Primary: `ProcurementLine`
- Transaction boundary: create planned procurement line under the procurement header
- Approval required: Yes

Command: `AddProcurementLineCommand`
Validation: procurement belongs to tenant; quantity/price from quotation/budget may be optional in Phase 1 but linkage should be supported if available.
Domain service: `ProcurementLineService.addLine()`
Domain event: `ProcurementLinePlanned`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "planned" } }
```

Request:
```json
{
  "description": "string",
  "category": "string",
  "budgetedAmount": 10000,
  "currency": "INR",
  "quantity": 1,
  "quotationLineItemId": "uuid|null",
  "notes": "string|null"
}
```

Note: frozen OpenAPI uses flat `budgetedAmount` + optional `currency` (not nested Money).

8. `POST /api/v1/procurement/lines/:lineId/transition`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `procurement:transition`
- Primary: `ProcurementLine`
- Transaction boundary: update state + timestamps
- Approval required: Yes

Command: `TransitionProcurementLineCommand(lineId, toStatus, notes?)`
Validation:
- `toStatus` reachable in procurement state machine (per `docs/business/07-vendor-management.md` and `docs/19`)
- optional cost variance recording when applicable (EP1-VEN-005) via `actualAmount` + `costVarianceReason`
- optimistic concurrency via If-Match for updates
Domain service: `ProcurementLineService.transitionTo()`
Domain event: `ProcurementLineStatusChanged`
Suggestion: none (explicit transitions)
Response:
```json
{ "data": { "id": "uuid", "status": "confirmed", "confirmedAt": "..." } }
```

Request:
```json
{ "toStatus": "requested|confirmed|delivered|completed", "occurredAt": "YYYY-MM-DDTHH:mm:ssZ|null", "notes": "string|null", "actualAmount": 0, "costVarianceReason": "market_price_increase|…|other|null" }
```

Note: frozen OpenAPI field is **`toStatus`** (not `toState`). Targets exclude `planned` (create starts planned). Requires `If-Match`.

9. `POST /api/v1/procurement/lines/:lineId/issue-notes`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `procurement:notes:write`
- Primary: `ProcurementLineIssueNote` (owned entity / note row)
- Transaction boundary: append issue note for procurement line
- Approval required: Yes

Command: `AddProcurementLineIssueNoteCommand`
Validation: line belongs to tenant; message non-empty.
Domain service: `ProcurementLineService.addIssueNote()`
Domain event: `ProcurementLineIssueNoteAdded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid" } }
```

Request:
```json
{ "message": "string", "severity": "low|medium|high", "occurredAt": "YYYY-MM-DDTHH:mm:ssZ|null" }
```

---

## Module: Inventory

### Purpose

- Inventory master management
- Event-linked inventory movement through Phase 1 movement states:
  Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready
- P2-07 extends the FSM with packing/dispatch/return-verify statuses (Phase 1 path remains valid)
- Booking-scoped reservations with availability checks
- Packing/checklist workflow uses `checklist.generate` suggestion acceptance
- Inventory movement photos (deferred) and damage/loss notes + structured damage reports

### Application Services

- `InventoryService`
- `InventoryMovementService`
- `InventoryReservationService` (P2-07)
- `InventoryVerificationService` / `InventoryDamageReportService` (P2-07)
- `InventoryAvailabilityService` (P2-07)
- `PackingListService` (invoked via checklist suggestion acceptance)

### Additive P2-07 endpoints

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/api/v1/inventory-reservations` | `inventory:write` | Create reservation; optional `vendorProcurementId` |
| GET | `/api/v1/inventory-reservations/:id` | `inventory:read` | Detail |
| PATCH | `/api/v1/inventory-reservations/:id` | `inventory:write` | Modify quantity/notes; If-Match |
| POST | `/api/v1/inventory-reservations/:id/release` | `inventory:write` | Release hold; If-Match |
| POST | `/api/v1/inventory-reservations/:id/cancel` | `inventory:write` | Cancel; If-Match |
| GET | `/api/v1/bookings/:id/inventory-reservations` | `inventory:read` | Booking-scoped list |
| GET | `/api/v1/inventory/movements` | `inventory:read` | Tenant-wide movement list |
| POST | `/api/v1/inventory-verification/:movementId` | `inventory:move:confirm` | Record verification |
| GET | `/api/v1/inventory-verification/by-movement/:movementId` | `inventory:read` | List verifications |
| POST | `/api/v1/inventory-damage/:movementId` | `inventory:damage-notes:write` | Structured damage report (metadata only) |
| GET | `/api/v1/inventory-damage/by-movement/:movementId` | `inventory:read` | List damage reports |

**Availability:** `availableQuantity = quantityAtJpNagar − active reservations − unlinked active movements`. Over-allocation → `INSUFFICIENT_INVENTORY` (HTTP **409**).

**Movement `toStatus` (extended):** Phase 1 values plus `packing_started`, `verified`, `ready_for_dispatch`, `dispatched`, `return_verified`, `cancelled`.

### Primary aggregates

- `InventoryItem`
- `InventoryMovement`
- `InventoryReservation` (P2-07)
- `PackingList`
- `DamageNote`
- `InventoryVerification` / `InventoryDamageReport` (P2-07)

### Related EP1 IDs

- EP1-INV-001–EP1-INV-007

---

### REST Endpoints

Inventory item master:

1. `GET /api/v1/inventory/items`
- Role: `viewer`, `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `inventory:read`
- Primary: `InventoryItem`
- Transaction boundary: read-only
- Approval required: No

2. `POST /api/v1/inventory/items`
- Role: `operations_manager`, `owner`, `admin`
- Permission: `inventory:write`
- Primary: `InventoryItem`
- Transaction boundary: create inventory item
- Approval required: Yes

Command: `CreateInventoryItemCommand(payload)`
Validation:
- tenant scoped
- taxonomy is one of `reusable|consumable|per_event`
- quantity at JP Nagar is non-negative
Domain service: `InventoryService.createItem()`
Domain event: `InventoryItemCreated`
Suggestion: none
Response model:
```json
{ "data": { "id": "uuid", "taxonomy": "reusable|consumable|per_event", "status": "active" } }
```
Request model:
```json
{
  "name": "string",
  "sku": "string|null",
  "category": "string",
  "taxonomy": "reusable|consumable|per_event",
  "unit": "string",
  "condition": "good|fair|damaged|retired",
  "quantityAtJpNagar": 0
}
```

3. `PATCH /api/v1/inventory/items/:id`
- Role/perm: `inventory:write`
- Primary: `InventoryItem`
- Transaction boundary: update item
- Approval required: Yes

If-Match required.

Command: `UpdateInventoryItemCommand(itemId, payload)`
Validation:
- item belongs to tenant
- updated taxonomy/category/unit/condition valid
- updated JP Nagar quantity is non-negative
Domain service: `InventoryService.updateItem()`
Domain event: `InventoryItemUpdated`
Suggestion: none
Response model:
```json
{ "data": { "id": "uuid", "status": "active|inactive|retired" } }
```
Request model:
```json
{ "name": "string|null", "quantityAtJpNagar": 0, "status": "active|inactive|retired", "version": 1 }
```

State-changing endpoints for event movements:

4. `GET /api/v1/bookings/:id/inventory-movements`
- Role: module roles + viewer
- Permission: `inventory:read`
- Primary: `InventoryMovement`
- Approval required: No

5. `POST /api/v1/inventory/movements`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `inventory:move:write`
- Primary: `InventoryMovement`
- Transaction boundary: create planned movement linked to booking + inventory item
- Approval required: Yes

Command: `CreateInventoryMovementCommand`
Validation: booking belongs to tenant; planned movement aligns with packing list draft.
Domain service: `InventoryMovementService.createPlanned()`
Domain event: `InventoryMovementPlanned`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "state": "planned" } }
```

Request:
```json
{ "bookingId": "uuid", "inventoryItemId": "uuid", "quantity": 1, "notes": "string|null", "reservationId": "uuid|null" }
```
Note (P2-07): optional `reservationId` links the movement to an active reservation; availability still enforced (`INSUFFICIENT_INVENTORY` → 409).

6. `POST /api/v1/inventory/movements/:movementId/transition`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `inventory:move:confirm`
- Primary: `InventoryMovement`
- Transaction boundary: transition state + timestamps
- Approval required: Yes

Command: `TransitionInventoryMovementCommand`
Validation: reachable state transitions; EP1-STF-003 movement permissions for actor; optimistic concurrency (If-Match).
Domain service: `InventoryMovementService.transitionTo()`
Domain event: `InventoryMovementStateChanged`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "state": "picked", "pickedAt": "..." } }
```

Request:
```json
{ "toStatus": "picked|packing_started|packed|verified|ready_for_dispatch|loaded|dispatched|at_venue|returned|return_verified|cleaned_ready|cancelled", "occurredAt": "YYYY-MM-DDTHH:mm:ssZ|null", "notes": "string|null" }
```
Note: frozen OpenAPI field is **`toStatus`** (not `toState`). Targets exclude `planned` (create starts planned). Requires `If-Match`. Phase 1 path remains valid; P2-07 statuses are additive. Optional packing/dispatch/return fields (`packedByUserId`, `verificationNotes`, `vehicle`, `driverName`, return quantities) may accompany transitions. No `GET /inventory/items/:id` in Phase 1 — item detail uses list + find.

7. `POST /api/v1/inventory/movements/:movementId/photos` — **not shipped in Phase 1**
- Status: deferred (Attachment aggregate / `inventory:photos:write` unbound — see unbound-permissions table)
- Permission (when shipped): `inventory:photos:write`
- Primary: `Attachment` linked to InventoryMovement
- Do not implement until Attachment + upload pipeline land

8. `POST /api/v1/inventory/movements/:movementId/damage-notes`
- Role: `operations_manager`, `coordinator`, `owner`, `admin`
- Permission: `inventory:damage-notes:write`
- Primary: `DamageNote` (owned)
- Transaction boundary: append damage/loss note for movement
- Approval required: Yes

Command: `AddDamageNoteCommand`
Validation: movement belongs to tenant; note message non-empty.
Domain service: `InventoryMovementService.addDamageNote()`
Domain event: `DamageNoteAdded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid" } }
```

Request:
```json
{ "message": "string", "accountability": "string|null", "occurredAt": "YYYY-MM-DDTHH:mm:ssZ|null" }
```

---

## Module: Payments

### Purpose

- Record customer advance/balance payments for an event
- Optional payment proof attachments with missing-proof reason allowed in Phase 1

### Application Services

- `PaymentService`

### Primary aggregates

- `Payment`

### Related EP1 IDs

- EP1-FIN-003
- EP1-BR-001 (advance before Approved gate)

---

### REST Endpoints

Reads:

1. `GET /api/v1/bookings/:id/payments`
- Role: `finance`, `owner`, `admin`, `viewer`
- Permission: `payments:read`
- Primary: `Payment`
- Approval required: No

State-changing:

2. `POST /api/v1/payments`
- Role: `finance`, `owner`, `admin`
- Permission: `payments:record`
- Primary: `Payment`
- Transaction boundary: record payment + link optional attachment
- Approval required: Yes

Command: `RecordPaymentCommand`
Validation:
- referenced booking belongs to tenant
- payment amount obeys domain invariants
- attachmentId optional; missingProofReason required only if proof absent per domain constraints
- If-Match only needed on updates (create doesn’t)
Domain service: `PaymentService.record()`
Domain event: `PaymentRecorded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "bookingId": "uuid|null", "amount": 200000, "currency": "INR", "status": "confirmed|void", "receivedAt": "..." } }
```

Request:
```json
{
  "bookingId": "uuid|null",
  "leadId": "uuid|null",
  "quotationId": "uuid|null",
  "invoiceId": "uuid|null",
  "amount": 200000,
  "currency": "INR",
  "method": "upi|cash|bank_transfer|card|cheque|other",
  "receivedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "attachmentId": "uuid|null",
  "missingProofReason": "string|null",
  "notes": "string|null"
}
```
Note: flat `amount` + `currency` on the wire. Status enum is **`confirmed` | `void`** (not `recorded`). Attachment **upload** API is not shipped — `attachmentId` is optional UUID only.

3. `POST /api/v1/payments/:id/void`
- Role: `finance`, `owner`, `admin`
- Permission: `payments:void`
- Primary: `Payment`
- Transaction boundary: mark payment void + derived recalculation hooks
- Approval required: Yes

Command: `VoidPaymentCommand`
Validation: allowed by domain (void only if permitted; avoid breaking Completed if already locked by business rules)
Domain service: `PaymentService.void()`
Domain event: `PaymentVoided`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "void" } }
```

---

## Module: Finance

### Purpose

- Manage invoicing (event-linked)
- Record vendor expenses (event-linked)
- Read profitability view (Phase 1)
- Register and verify financial document **metadata** (P2-08; no binary storage / PDF generation)

### Application Services

- `InvoiceService`
- `ExpenseService`
- `ProfitabilityService`
- `FinancialDocumentApplicationService` (P2-08)

### Primary aggregates

- `Invoice`
- `VendorExpense`
- `FinancialDocument` (P2-08)

### Related EP1 IDs

- EP1-FIN-002 (invoices)
- EP1-FIN-003 (payment proofs via FinancialDocument)
- EP1-FIN-004–005 (expenses + profitability)
- EP1-BR-002 (financial review before Completed)

---

### REST Endpoints

Invoices:

1. `GET /api/v1/bookings/:id/invoices`
- Role: `finance`, `owner`, `admin`, `viewer`
- Permission: `invoices:read`
- Primary: `Invoice`
- Approval required: No

2. `POST /api/v1/invoices`
- Role: `finance`, `owner`, `admin`
- Permission: `invoices:write`
- Primary: `Invoice`
- Transaction boundary: create invoice for event
- Approval required: Yes

Command: `CreateInvoiceCommand`
Validation: event belongs to tenant; quotation-linked rules as per Phase 1 billing logic (domain invariant).
Domain service: `InvoiceService.create()`
Domain event: `InvoiceCreated`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "eventId": "uuid", "status": "draft" } }
```

Request:
```json
{ "bookingId": "uuid", "customerId": "uuid", "lineItems": [{ "description": "string", "quantity": 1, "unitPriceAmount": 0, "currency": "INR|null" }], "notes": "string|null" }
```
Note: frozen OpenAPI uses **`customerId`** (not `clientId`); line unit price is flat `unitPriceAmount`.

3. `POST /api/v1/invoices/:id/send`
- Role: `finance`, `owner`, `admin`
- Permission: `invoices:send`
- Primary: `Invoice`
- Transaction boundary: set sent + store send context
- Approval required: Yes

Command: `SendInvoiceCommand`
Validation: invoice sendable (domain)
Domain service: `InvoiceService.send()`
Domain event: `InvoiceSent`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "sent" } }
```

Request:
```json
{ "channel": "email|other", "recipient": "string|null" }
```

4. `POST /api/v1/invoices/:id/void`
- Role: `finance`, `owner`, `admin`
- Permission: `invoices:void`
- Primary: `Invoice`
- Transaction boundary: mark void; prevent further payments by domain rule
- Approval required: Yes

Command: `VoidInvoiceCommand`
Validation: allowed by domain
Domain service: `InvoiceService.void()`
Domain event: `InvoiceVoided`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "void" } }
```

Expenses:

5. `GET /api/v1/bookings/:id/expenses`
- Role: `finance`, `owner`, `admin`, `viewer`
- Permission: `expenses:read`
- Primary: `VendorExpense`
- Approval required: No

6. `POST /api/v1/bookings/:id/expenses`
- Role: `finance`, `owner`, `admin`
- Permission: `expenses:write`
- Primary: `VendorExpense`
- Transaction boundary: record expense + optional proof attachment
- Approval required: Yes

Command: `RecordExpenseCommand`
Validation: booking belongs to tenant; optional procurementLineId belongs to tenant.
Domain service: `ExpenseService.record()`
Domain event: `ExpenseRecorded`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "bookingId": "uuid", "amount": 50000, "currency": "INR", "status": "confirmed|void" } }
```

Request:
```json
{
  "vendorId": "uuid",
  "procurementLineId": "uuid|null",
  "amount": 50000,
  "currency": "INR",
  "paidAt": "YYYY-MM-DDTHH:mm:ssZ",
  "method": "upi|cash|bank_transfer|card|cheque|other",
  "attachmentId": "uuid|null",
  "notes": "string|null"
}
```
Note: flat `amount` + `currency`; expense status **`confirmed` | `void`**.

7. `POST /api/v1/expenses/:id/void`
- Role: `finance`, `owner`, `admin`
- Permission: `expenses:void`
- Primary: `VendorExpense`
- Transaction boundary: mark void
- Approval required: Yes

Command: `VoidExpenseCommand`
Validation: allowed by domain
Domain service: `ExpenseService.void()`
Domain event: `ExpenseVoided`
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "void" } }
```

Profitability:

8. `GET /api/v1/bookings/:id/profitability`
- Role: `finance`, `owner`, `admin`, `viewer`
- Permission: `profitability:read`
- Primary: derived read model
- Approval required: No

Response:
```json
{ "data": { "eventId": "uuid", "revenue": { "amount": 0, "currency": "INR" }, "vendorExpenses": { "amount": 0, "currency": "INR" }, "grossMargin": { "amount": 0, "currency": "INR" } } }
```

### Additive P2-08 — Financial documents

Metadata-only evidence records. Payments, expenses, invoices, and profitability endpoints above are **unchanged**.

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| POST | `/api/v1/financial-documents` | `documents:write` | Register metadata (`bookingId` required; optional payment/expense/procurement/invoice links) |
| GET | `/api/v1/financial-documents/:id` | `documents:read` | Detail |
| PATCH | `/api/v1/financial-documents/:id` | `documents:write` | Update metadata; If-Match |
| POST | `/api/v1/financial-documents/:id/verify` | `documents:verify` | `pending` → `verified`; If-Match |
| POST | `/api/v1/financial-documents/:id/reject` | `documents:verify` | `pending` → `rejected`; If-Match |
| POST | `/api/v1/financial-documents/:id/delete` | `documents:write` | Soft-delete (`deletedAt`); If-Match |
| GET | `/api/v1/financial-documents/:id/audit-events` | `documents:read` | Append-only audit trail |
| GET | `/api/v1/payment-documents/:paymentId` | `documents:read` | Documents linked to a payment |
| GET | `/api/v1/expense-documents/:expenseId` | `documents:read` | Documents linked to a vendor expense |
| GET | `/api/v1/bookings/:id/financial-documents` | `documents:read` | Booking-scoped list |

Roles: `finance`, `owner`, `admin` for write/verify; `viewer` for read. No binary upload body — fields are `fileName`, `mimeType`, `fileSizeBytes`, `storageKey` only.

---

## Module: Communication Center (P2-09)

### Purpose

- Shared operational communication log, templates, manual reminders, and preference storage
- No WhatsApp/email/SMS provider integration; no background scheduler; no AI generation
- Preserve Customer / Staff / Vendor / Booking aggregates (optional FK links only)

### Application Services

- `CommunicationApplicationService`
- `CommunicationTemplateApplicationService`
- `ReminderApplicationService`
- `NotificationPreferenceApplicationService`

### Primary aggregates

- `CommunicationRecord`, `CommunicationAttachment`
- `CommunicationTemplate`
- `Reminder`
- `NotificationPreference`

### Related EP1 IDs

- EP1-CUS-002 (operational communication tracking)

### REST Endpoints

#### Communications

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/communications` | `communications:read` | Tenant list |
| GET | `/api/v1/communications/:id` | `communications:read` | Detail |
| GET | `/api/v1/communications/:id/attachments` | `communications:read` | Metadata attachments |
| POST | `/api/v1/communications` | `communications:write` | Create (`draft` / `queued` / manual `completed`) |
| PATCH | `/api/v1/communications/:id` | `communications:write` | Update metadata/links; If-Match |
| POST | `/api/v1/communications/:id/transition` | `communications:write` | Status lifecycle; If-Match |
| POST | `/api/v1/communications/:id/delete` | `communications:write` | Soft-delete; If-Match |
| POST | `/api/v1/communications/:id/attachments` | `communications:write` | Register metadata attachment |
| POST | `/api/v1/communications/:id/attachments/:attachmentId/delete` | `communications:write` | Soft-delete attachment |

#### Communication templates

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/communication-templates` | `communication-templates:read` | List |
| GET | `/api/v1/communication-templates/:id` | `communication-templates:read` | Detail |
| POST | `/api/v1/communication-templates` | `communication-templates:write` | Create |
| PATCH | `/api/v1/communication-templates/:id` | `communication-templates:write` | Update; If-Match |
| POST | `/api/v1/communication-templates/:id/archive` | `communication-templates:write` | `active` → `archived`; If-Match |

#### Reminders

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/reminders` | `reminders:read` | Tenant list |
| GET | `/api/v1/reminders/:id` | `reminders:read` | Detail |
| POST | `/api/v1/reminders` | `reminders:write` | Create (manual; no scheduler) |
| POST | `/api/v1/reminders/:id/complete` | `reminders:write` | `pending` → `completed`; If-Match |
| POST | `/api/v1/reminders/:id/cancel` | `reminders:write` | `pending` → `cancelled`; If-Match |

#### Booking nested lists

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/bookings/:id/communications` | `communications:read` | Booking-scoped communications |
| GET | `/api/v1/bookings/:id/reminders` | `reminders:read` | Booking-scoped reminders |

#### Notification preferences (future-ready)

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/notification-preferences?customerId=` | `clients:read` | Preference storage only |
| GET | `/api/v1/notification-preferences/customers/:customerId` | `clients:read` | Path variant |
| PUT | `/api/v1/notification-preferences` | `clients:write` | Upsert; no delivery |

Roles: `sales_manager`, `operations_manager`, `coordinator`, `owner`, `admin` for write; `viewer` for read. `WorkspaceDto` unchanged — thin GET preserved; progress/activity gain additive communication fields only.

---

## Module: Calendar (P2-10 — Unified Operations Calendar & Timeline)

### Purpose

- Read-only aggregation / composition layer providing a unified operations planning dashboard, calendar (day/week/month), agenda, chronological timeline, and cross-module conflict overlay
- **No persisted `CalendarEntry` table, no write ownership, no duplicate scheduling data** — every entry is a projection assembled at request time from Event, Staff*, VendorProcurement, Inventory*, Reminder, CommunicationRecord, FinancialDocument
- `WorkspaceDto` is **unchanged** — Calendar is a sibling composition API; the Event Workspace only deep-links into it (no expansion of the workspace response shape)

### Application Services

- `CalendarApplicationService` — aggregates read models; reuses `SchedulingApplicationService.detectConflictsForStaffOnBooking` (Staff) and `InventoryAvailabilityService` (Inventory) for display-only conflict detection; introduces no new domain/validation rules

### Primary aggregates

- None owned. Read models only: `CalendarEntryDto`, `CalendarPlanningDashboardDto`, `CalendarConflictsDto` / `CalendarConflictItemDto`

### Related EP1 IDs

- EP1-OPS-005 (event dates / calendar linkage)

### REST Endpoints

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/api/v1/calendar` | `calendar:read` | Planning dashboard — today/upcoming events, today's staff, pending procurements, inventory dispatches, pending reminders, overdue items |
| GET | `/api/v1/calendar/events` | `calendar:read` | Unified calendar entries for day/week/month views; `from`/`to` required |
| GET | `/api/v1/calendar/agenda` | `calendar:read` | Agenda view (same aggregation as `/calendar/events`, list-oriented) |
| GET | `/api/v1/calendar/timeline` | `calendar:read` | Chronological timeline; additionally surfaces `communication` and `finance_document` sources |
| GET | `/api/v1/calendar/conflicts` | `calendar:read` | Display-only conflict overlay — staff conflicts, inventory shortages, procurement delays, pending reminders |

#### Query filters (`/calendar/events`, `/calendar/agenda`, `/calendar/timeline`)

| Param | Type | Notes |
|-------|------|-------|
| `from` | `string` (`z.string().date()`) | Required |
| `to` | `string` (`z.string().date()`) | Required |
| `bookingId` | `uuid` | Optional |
| `staffMemberId` | `uuid` | Optional |
| `vendorId` | `uuid` | Optional |
| `customerId` | `uuid` | Optional |
| `inventoryItemId` | `uuid` | Optional |
| `eventType` | `string` | Optional |
| `status` | `string` | Optional |
| `sources` | `string` (comma-separated `CalendarEntrySource`) | Optional — `event`, `staff_assignment`, `staff_leave`, `staff_availability`, `procurement`, `inventory_movement`, `inventory_reservation`, `reminder`, `communication`, `finance_document` |

`/calendar/conflicts` accepts `from`, `to` (required) and `bookingId` (optional) only.

Roles: `owner`, `admin`, `sales_manager`, `operations_manager`, `coordinator`, `viewer` — all read-only (`calendar:read`). No write permission exists for this module. No Prisma migration was required for P2-10.

---

## Module: Analytics (P2-12 — Business Intelligence KPI Dashboards)

### Purpose

- Tenant-wide **read-only** BI aggregation: founder KPIs, sales, finance, staff, vendors, inventory, customers, operations, historical trends, and export
- Additive surface under `/api/v1/analytics/*` — Phase-1 `/api/v1/dashboards/*` remains **frozen** and unchanged
- No AI / predictive / forecasting

### Application Services

- `AnalyticsApplicationService` — `getDashboard`, `getSales`, `getFinance`, `getStaff`, `getVendors`, `getInventory`, `getCustomers`, `getOperations`, `getTrends`, `exportDataset`

### Primary aggregates

- None owned — derived KPI read models only (`Analytics*Dto`)

### Related EP1 IDs

- EP1-KPI-001–EP1-KPI-007, EP1-MKT-001–002

### REST Endpoints

All routes are under HTTP resource **`analytics`**. Permission: **`analytics:read`**. No Prisma migration (additive `findAll` on Quotation and Customer repositories only). Roles with `analytics:read`: `owner`, `admin`, `sales_manager`, `operations_manager`, `coordinator`, `finance`, `viewer`.

| Method | Path | Permission | Notes |
| ------ | ---- | ---------- | ----- |
| GET | `/api/v1/analytics/dashboard` | `analytics:read` | Founder BI rollup; optional `from` / `to` |
| GET | `/api/v1/analytics/sales` | `analytics:read` | Lead conversion, quote acceptance, revenue breakdowns; optional period |
| GET | `/api/v1/analytics/finance` | `analytics:read` | Revenue / expenses / profit / receivables; optional period |
| GET | `/api/v1/analytics/staff` | `analytics:read` | Utilisation and workload |
| GET | `/api/v1/analytics/vendors` | `analytics:read` | Procurement completion and spend |
| GET | `/api/v1/analytics/inventory` | `analytics:read` | Reservations, movements, dispatch trends |
| GET | `/api/v1/analytics/customers` | `analytics:read` | Retention + health distribution (P2-11 ladder); optional period |
| GET | `/api/v1/analytics/operations` | `analytics:read` | Ops counters (today / upcoming / overdue / pending) |
| GET | `/api/v1/analytics/trends` | `analytics:read` | Historical buckets only; optional `from` / `to` / `granularity` (`daily`\|`weekly`\|`monthly`\|`yearly`) |
| GET | `/api/v1/analytics/export` | `analytics:read` | Required `dataset`; optional `format` (`csv`\|`xlsx`), `from` / `to` |

#### KPI / export notes

| Concern | Rule |
|---------|------|
| Revenue / expenses / profit | Confirmed payments and confirmed vendor expenses (same basis as `ProfitabilityApplicationService`) |
| Lead conversion | Stages `approved` \| `completed` |
| Customer health | Mirrors P2-11 priority ladder — no AI |
| Trends | Historical buckets only — no forecasting |
| Export `csv` | UTF-8 CSV text in `content` |
| Export `xlsx` | Excel-compatible **SpreadsheetML** (`.xls` filename, `application/vnd.ms-excel`, base64 in `content`) — not Office Open XML binary |

---

## Module: Dashboard

### Purpose

- Founder KPI dashboard read-only (Phase 1) — **frozen**; do not extend for P2-12 BI
- P2-12 BI lives under **Analytics** (`/analytics/*`)

### Application Services

- `DashboardService`

### Primary aggregates

- Derived KPI read models

### Related EP1 IDs

- EP1-KPI-001–EP1-KPI-007

---

### REST Endpoint

`GET /api/v1/dashboards/founder`

- Required role: `owner`, `admin`, `viewer` (read), optionally `sales_manager` (if permitted)
- Expected permission: `dashboards:read`
- Primary aggregate: derived KPI read model
- Transaction boundary: read-only
- User approval required: No
- **P2-12:** this Phase-1 surface remains frozen; new BI consumers use `/api/v1/analytics/*`

Response model:
```json
{ "data": { "weekOf": "YYYY-MM-DD", "kpis": { "enquiries": 0, "conversionRate": 0.0, "eventsCompleted": 0, "grossMargin": { "amount": 0, "currency": "INR" }, "leadSourcePerformance": {} } } }
```

---

## Module: Administration

### Purpose

- Suggestion accept/dismiss flow (ADR-017)
- Tenant settings minimal management in Phase 1

### Application Services

- `SuggestionService`
- `TenantSettingsService`

### Primary aggregates

- `Suggestion`
- `TenantSettings`

### Related EP1 IDs

- EP1-AUT-001–EP1-AUT-006

---

### REST Endpoints

Suggestions:

1. `GET /api/v1/suggestions?status=pending`
- Role: roles that can approve the underlying suggestion types (implementation configured)
- Permission: `suggestions:read`
- Primary: `Suggestion`
- Approval required: No

2. `POST /api/v1/suggestions/:id/accept`
- Role: depends on suggestion type
- Permission: `suggestions:accept`
- Primary: `Suggestion`
- Transaction boundary: execute corresponding application service use case (human confirmation)
- Approval required: Yes

Suggestion types handled in Phase 1:
 - `workspace.create`: operations_manager/coordinator/owner/admin — executes `WorkspaceService.activateWorkspace()`
 - `staff.assign`: operations_manager/owner/admin — executes staff assignment accept path
 - `checklist.generate`: operations_manager/coordinator/owner/admin — executes `EventChecklistApplicationService.generateFromTemplates()` (P2-02)

Command: `AcceptSuggestionCommand`
Validation:
- suggestion in `pending`
- suggestion type maps to accepted action path
- permission check for approver
Domain service: `SuggestionApplicationService.accept()`
Domain event: created during invoked action (handlers still suggestion-only)
Suggestion: may create additional follow-up suggestions/alerts after acceptance (allowed)
Response (successful executable types):
```json
{ "data": { "id": "uuid", "status": "accepted" } }
```

Request model:
```json
{ "comment": "string|null" }
```

3. `POST /api/v1/suggestions/:id/dismiss`
- Role: same as accept (approver roles)
- Permission: `suggestions:dismiss`
- Primary: `Suggestion`
- Transaction boundary: mark dismissed + audit
- Approval required: Yes

Command: `DismissSuggestionCommand`
Validation: suggestion is pending
Domain service: `SuggestionService.dismiss()`
Domain event: `SuggestionDismissed` (optional)
Suggestion: none
Response:
```json
{ "data": { "id": "uuid", "status": "dismissed" } }
```

Tenant settings:

4. `GET /api/v1/settings`
- Role: `owner`, `admin`
- Permission: `settings:read`
- Primary: `TenantSettings`
- Approval required: No
- Note (R3-08): `admin` **is** authorized for tenant settings in Phase 1 (same as `owner` for these endpoints). Do not apply a docs/05-era “admin excludes tenant settings” rule.

5. `PATCH /api/v1/settings`
- Role: `owner`, `admin`
- Permission: `settings:write`
- Primary: `TenantSettings`
- Transaction boundary: update settings
- Approval required: Yes (explicit)
- Note (R3-08): same as GET — `admin` holds `settings:write` in Phase 1.

If-Match optional depending on implementation.

Command: `UpdateTenantSettingsCommand`
Validation: schema; tenant scope
Domain service: `TenantSettingsService.update()`
Domain event: `TenantSettingsUpdated`
Suggestion: none
Response:
```json
{ "data": { "tenantId": "uuid", "updated": true } }
```

---

## Deferred / Non-Phase-1 API Concerns

This API design intentionally excludes:

- Multi-tenant SaaS onboarding and tenant isolation test endpoints
- Client portal APIs
- Full CMS / marketing platform endpoints
- AI assistant quote/message drafting endpoints
- WhatsApp replacement channel endpoints

---

## Phase 1 OpenAPI Contract Freeze (R3-13)

As of 2026-07-13, the **implemented** Phase 1 HTTP surface is frozen for client generation and frontend work.

| Artifact | Location |
|----------|----------|
| Live Swagger UI | `GET /docs` (**development / staging only** — disabled when `NODE_ENV=production`) |
| Live OpenAPI JSON | `GET /docs/json` (same env gate as Swagger UI) |
| Frozen snapshot | `apps/api/openapi/openapi.v1.json` (`pnpm openapi:export`) |
| Permission matrix | This document §Phase 1 Role × Permission Matrix + `rbac.ts` |

### Freeze rules

After R3-13, without explicit approval:

- No breaking changes (rename/remove endpoints, required fields, status semantics)
- No request or response contract changes
- No permission key or role-grant changes
- No DTO restructuring that alters wire JSON
- Bug fixes that preserve the wire contract are allowed

### Regenerating the snapshot

```bash
cd apps/api
pnpm openapi:export
```

Compare the regenerated file to the committed snapshot before accepting any API change.

### Explicitly not in the Phase 1 OpenAPI surface

- `GET /api/v1/clients` (list)
- `GET /api/v1/quotations` (list)
- `GET /api/v1/bookings` (list)
- `GET /api/v1/quotations/:id/pdf`
- `GET /api/v1/inventory/items/:id` (item detail — use `GET /inventory/items` + find)
- `POST /api/v1/inventory/movements/:movementId/photos`
- Audit-log HTTP API / Attachment upload pipeline
- Global payment / invoice / expense list endpoints (booking-scoped reads only)

### Admin Portal realization (R4-01)

Frozen OpenAPI remains the wire contract. Admin Portal (`apps/web`, F1-01–F1-13):

- **Static export** Next.js App Router client app (ADR-007 SPA intent); entity routes use `?id=` query params (no dynamic `[id]` segments)
- **Hub-when-no-list** for customers, quotations, bookings, finance, and inventory movements
- **Thin workspace** view + activate; ops panels via booking-scoped finance/inventory modules
- Dashboard consumes a **hybrid subset** of `/dashboards/*` (founder + ops metrics); unused dashboard routes remain available for later UI
- Reports (`F1-14`) and Settings (`F1-15`) UI remain placeholders as of R4-01

---

*Last updated: 2026-07-13 (R4-01)*
*Owner: Founding Engineering*

