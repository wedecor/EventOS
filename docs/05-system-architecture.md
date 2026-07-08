# System Architecture

## Purpose of This Document

This document describes the technical architecture of Event OS: system components, layers, data flow, tenancy model, and integration patterns. It is the blueprint that all implementation must follow.

**Business baseline (authoritative for We Decor Phase 1):** [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md)  
**Aligned module/roadmap/DoD:** [`06-module-design.md`](./06-module-design.md), [`11-roadmap.md`](./11-roadmap.md), [`20-definition-of-done.md`](./20-definition-of-done.md)

*This document describes the **platform architecture pattern**. **Phase 1 (We Decor)** scope is documented in sections below; business requirements remain authoritative in doc `19`.*

---

## Architecture Overview

Event OS is a **modular monolith** deployed as a single application with a clear internal module structure, backed by PostgreSQL, with optional async processing for side effects.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Web App     │  │ Mobile (PWA) │  │ Client Portal│  │  Public API  │    │
│  │  (React)     │  │  (Future)    │  │ (Not Phase 1)│  │  (Future)    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘
          │                 │                 │                 │
          └─────────────────┴────────┬────────┴─────────────────┘
                                     │ HTTPS / REST API
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         API GATEWAY LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Authentication  │  Org Context (P1)  │  Rate Limiting  │  CORS      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                      APPLICATION (MODULAR MONOLITH)                          │
│                                                                              │
│  ┌──────┐ ┌──────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐   │
│  │ CRM  │ │ Lead │ │ Quotation │ │ Booking │ │ Calendar │ │  Task    │   │
│  └──────┘ └──────┘ └───────────┘ └─────────┘ └──────────┘ └──────────┘   │
│  ┌──────┐ ┌──────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐                 │
│  │Staff │ │Vendor│ │ Inventory │ │ Finance │ │ BI (P1)  │                 │
│  └──────┘ └──────┘ └───────────┘ └─────────┘ └──────────┘                 │
│       │           │            │             │           │                  │
│  ┌────┴───────────┴────────────┴─────────────┴───────────┴────────────┐   │
│  │                    SHARED KERNEL                                      │   │
│  │  Auth Context │ Org Context │ Domain Events │ Common Value Objects  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    INFRASTRUCTURE LAYER                              │   │
│  │  Repositories │ External Adapters │ File Storage │ Email            │   │
│  │  (WhatsApp / AI adapters — not Phase 1)                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
   │ PostgreSQL  │          │    Redis    │          │  Object     │
   │  (Primary)  │          │  (Cache /   │          │  Storage    │
   │             │          │   Sessions /│          │  (S3-compat)│
   │             │          │   Queues)   │          │             │
   └─────────────┘          └─────────────┘          └─────────────┘
```

*P1 = Phase 1 scope. See **Phase 1 Module Inventory** and **Deferred Scope (Not Phase 1)** below.*

---

## Phase 1 Module Inventory

Authoritative business scope: [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md). Module boundaries: [`06-module-design.md`](./06-module-design.md).

| Domain | Phase 1 capability | Primary module(s) |
|--------|-------------------|-------------------|
| **Core** | Unified Event Record | Lead, Quotation, Booking (lifecycle) |
| **Core** | Event Workspace | Booking |
| **Core** | Execution Stages | Booking, Task |
| **Sales** | Lead extension | Lead (extend LM) |
| **Sales** | Booking transition | Lead → Quotation → Booking |
| **Customer** | Customer timeline | CRM |
| **Customer** | Issue notes | CRM |
| **Customer** | Review tracking | CRM |
| **Operations** | Tasks / checklists | Task |
| **Operations** | Calendar milestones | Calendar |
| **Staff** | Staff master | Staff |
| **Staff** | Assignment | Staff, Booking |
| **Staff** | Movement permissions | Staff (RBAC) |
| **Vendor** | Vendor master | Vendor |
| **Vendor** | Procurement workflow | Vendor |
| **Vendor** | Confirmation tracking | Vendor |
| **Inventory** | Inventory master | Inventory |
| **Inventory** | Movement states | Inventory |
| **Inventory** | Packing / return workflow | Inventory |
| **Finance** | Payments | Finance |
| **Finance** | Proofs | Finance, File Storage |
| **Finance** | Expenses | Finance |
| **Finance** | Profitability | Finance, BI (founder KPI) |
| **Marketing** | Lead source visibility | BI (founder KPI), Lead |
| **Marketing** | Event content library | File Storage, Booking |
| **BI** | Founder KPI dashboard only | BI (partial) |

---

## Unified Event Record

Phase 1 centres on a single **unified event record** that progresses through the sales-to-operations lifecycle. Once a quotation is approved, the **approved event** becomes the **operational source of truth** for execution, staffing, vendors, inventory, finance, and customer communication.

```
Lead
  ↓
Quotation
  ↓
Approved Event
  ↓
Event Workspace
  ↓
Execution
  ↓
Completion
```

| Stage | Responsibility | Notes |
|-------|----------------|-------|
| **Lead** | Lead module (extend LM) | Intake, qualification; website integration |
| **Quotation** | Quotation module | Pricing; parallel QB during transition |
| **Approved Event** | Booking module | Approval locks operational record |
| **Event Workspace** | Booking module | Hub for ops, staff, vendor, inventory, finance views |
| **Execution** | Booking, Task, Staff, Vendor, Inventory | Stages, checklists, assignments, movements |
| **Completion** | Booking, Finance, CRM | Financial close, review tracking |

All operational modules reference the same event aggregate. Status, tasks, and financial data on the event record supersede informal channels (e.g. external WhatsApp) as the authoritative record per doc `19`.

---

## Event Workspace

The **Event Workspace** is the Booking-module operational hub activated at **Approved Event**. It aggregates cross-module data for a single event without duplicating domain ownership.

### Execution stages

Configurable pipeline stages (e.g. preparation → setup → event day → teardown → closed) tracked on the event record. Stage transitions are **human-initiated**; see **Phase 1 Automation Policy**.

### Tasks and checklists

Task module provides event-linked tasks and checklist templates. Checklists support execution-stage gates; completion is recorded on the event workspace.

### Staff, vendor, and inventory relationships

| Relationship | Source module | Workspace view |
|--------------|---------------|----------------|
| Staff assignments | Staff | Assigned crew per event |
| Movement permissions | Staff (RBAC) | Who may confirm inventory movements |
| Vendor procurement | Vendor | Orders, confirmations per event |
| Inventory movements | Inventory | Packing, on-site, return states per event |

Modules remain bounded; the workspace **reads and links** — it does not replace module aggregates.

### Financial visibility

Finance module data surfaced on the workspace: payments received, proof attachments, expenses logged, and event-level profitability summary. Founder-level rollups live in the BI founder KPI dashboard.

---

## Phase 1 Automation Policy

Explicit rule for Phase 1 (`EP1-AUT-001`, `EP1-AUT-005`). Applies to domain events, background jobs, and any future AI integration.

**Automation provides:**

- Suggestions
- Recommendations
- Alerts (in-app; not auto-sent to customers/vendors)

**Automation does NOT:**

- Automatically notify customers or vendors
- Automatically assign staff
- Automatically approve changes
- Automatically trigger business actions

**Human approval is required** before any business action takes effect (assignments, stage transitions, vendor confirmations, inventory movements, payment recording, customer communications). Domain event handlers may enqueue suggestions or in-app alerts only — see **Domain Events**.

---

## Transitional Integrations

Phase 1 coexists with existing We Decor systems during transition (`19`, `11`).

### Lead Management Application

- **Extend** existing lead/sales capabilities into Event OS Lead module
- **Do not rebuild** the sales core from scratch
- Port patterns and data incrementally; LM remains usable during migration

### Quotation / Billing Application

- **Parallel run** during transition until Event OS billing is stable
- Quotations may originate in QB; approved events transition into Event OS workspace
- Cutover criteria defined in roadmap / DoD — not a Phase 1 architecture blocker

### We Decor Website

- **Lead capture integration** — website form/intake flows into Lead module
- SEO and public site continue outside Event OS; Event OS receives leads as system of record

---

## Deferred Scope (Not Phase 1)

The following are **explicitly out of Phase 1**. They must not block Phase 1 delivery or appear as implementation dependencies.

| Item | Phase 1 posture |
|------|-----------------|
| Multi-tenant SaaS | Single We Decor tenant; full SaaS isolation deferred |
| AI assistant | Stack entry retained; no Phase 1 build dependency |
| Full WhatsApp replacement | External WhatsApp continues; no in-app channel replacement |
| Client portal | Marked future in client diagram |
| Full CMS | Event content library only (adjunct to events) |
| Advanced BI | Founder KPI dashboard only |
| Full accounting ERP | Event-level finance only; no ERP integration |

See [`11-roadmap.md`](./11-roadmap.md) for product-phase placement of deferred items.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | TypeScript | Type safety, AI agent consistency, large ecosystem |
| **Runtime** | Node.js (LTS) | Mature, aligns with React frontend, strong async I/O |
| **Backend Framework** | NestJS | Enforces module boundaries, DI, decorators for cross-cutting concerns |
| **Frontend** | React + TypeScript | Component model, hiring pool, ecosystem |
| **UI Framework** | Tailwind CSS + component library (shadcn/ui or equivalent) | Utility-first, consistent design system |
| **Database** | PostgreSQL 16+ | ACID, JSON support, full-text search, mature |
| **ORM / Query** | Prisma ORM | Type-safe queries, schema management with Prisma Migrate |
| **Cache / Queue** | Redis + BullMQ | Session store, caching, and job queues over Redis |
| **Object Storage** | S3-compatible (AWS S3 / Cloudflare R2) | File uploads, document storage |
| **Search** | PostgreSQL full-text (initial); Elasticsearch (if needed) | Avoid premature search infrastructure |
| **AI** | OpenAI / Anthropic via abstraction layer | Provider-agnostic AI integration |
| **Email** | Transactional email service (Resend, SendGrid) | Deliverability |
| **WhatsApp** | WhatsApp Business API (via BSP) | Core channel for Indian market |
| **Auth** | JWT + refresh tokens; OAuth for social login (future) | Stateless API auth |
| **CI/CD** | GitHub Actions | Integrated with repository |
| **API Documentation** | Swagger/OpenAPI via NestJS integration | Discoverable REST contract and client generation |
| **Containerization** | Docker | Reproducible runtime for local, staging, and production |
| **Hosting** | Cloud VPS or managed PaaS (Railway, Fly.io, AWS) | Start simple, migrate as needed |
| **Monitoring** | Structured logging + error tracking (Sentry) + uptime monitoring | Production observability |

*Phase 1 note:* AI and WhatsApp rows describe **future platform capability**. They are **not Phase 1 build dependencies** — see **Deferred Scope (Not Phase 1)**.

**Why not microservices:** Team size, domain cohesion, and deployment simplicity. See [03-product-principles.md](./03-product-principles.md) Principle 3.

**Why TypeScript everywhere:** Single language across stack reduces context switching and enables shared types between frontend and backend.

---

## Layered Architecture (Per Module)

Each module follows the same internal layering:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  REST Controllers / GraphQL Resolvers   │
│  Request validation (DTOs)              │
│  Response serialization                 │
├─────────────────────────────────────────┤
│           Application Layer             │
│  Use Case Services (Commands/Queries)   │
│  Transaction boundaries                 │
│  Domain event publishing                │
├─────────────────────────────────────────┤
│             Domain Layer                │
│  Entities, Value Objects, Aggregates    │
│  Domain Services                        │
│  Domain Events                          │
│  Repository Interfaces                  │
├─────────────────────────────────────────┤
│          Infrastructure Layer           │
│  Repository Implementations (ORM)       │
│  External Service Adapters              │
│  Event Handlers (side effects)          │
└─────────────────────────────────────────┘
```

### Dependency Rule

Source code dependencies point **inward only**:

- Presentation → Application → Domain ← Infrastructure
- Domain layer has **zero** imports from infrastructure, framework, or presentation.
- Infrastructure implements interfaces defined in Domain.

---

## Tenancy Model

### Phase 1: Single We Decor Tenant

**Phase 1 operates as a single We Decor tenant.** Full multi-tenant SaaS isolation is **not** a Phase 1 delivery dependency.

- One organisation context for all users, data, and settings
- `tenant_id` (or equivalent org key) may exist in schema for future SaaS — fixed to We Decor in Phase 1
- Cross-tenant access tests and Row-Level Security (RLS) are **deferred** until multi-tenant SaaS (see [`20-definition-of-done.md`](./20-definition-of-done.md))
- API gateway uses **Org Context** resolution, not multi-tenant provisioning

*Resolved per ADR-016 ([`12-architecture-decisions.md`](./12-architecture-decisions.md)): full tenant-resolution plumbing with single seeded We Decor tenant; RLS and cross-tenant tests deferred to Phase 6 SaaS.*

### Future Strategy: Shared Database, Shared Schema, Row-Level Isolation

*For multi-tenant SaaS evolution — not Phase 1.*

| Approach | Description | Event OS Choice |
|----------|-------------|-----------------|
| Database per tenant | Separate DB per customer | ❌ Operationally expensive |
| Schema per tenant | Separate schema per customer | ❌ Migration complexity |
| Shared schema, row-level | `tenant_id` column on all tenant tables | ✅ Chosen (future SaaS) |

### Org / Tenant Context Resolution

Every API request resolves organisation context:

```
Request → Auth Middleware → Extract user → Load org context → Set OrgContext
                                                                  │
All queries scoped to org ◀────────────────────────────────────────┘
```

**OrgContext** (Phase 1: single We Decor tenant) is a request-scoped object containing:

```typescript
interface OrgContext {
  tenantId: string;       // Fixed We Decor value in Phase 1
  tenantSlug: string;
  settings: TenantSettings;
  userId: string;
  userRole: Role;
  permissions: Permission[];
}
```

### Enforcement

1. **Repository layer** — All queries scoped to org key via base repository or ORM middleware.
2. **Application layer** — Use cases receive OrgContext; never accept tenantId from request body.
3. **Integration tests (Phase 1)** — Module access and permission tests; cross-tenant tests deferred to SaaS phase.
4. **Database** — Row-Level Security (RLS) policies as defense-in-depth when multi-tenant SaaS ships.

### Tenant Configuration

Stored in `tenant_settings` table (JSONB for flexibility):

- Business name, logo, branding colors
- Tax configuration (rate, inclusive/exclusive)
- Quotation/booking/invoice numbering format
- Default currency and locale
- Pipeline stage customization
- Event templates
- Feature flags
- Integration credentials (encrypted)

---

## Authentication & Authorization

### Authentication Flow

```
1. User submits credentials (email + password)
2. Server validates, returns access token (JWT, 15min) + refresh token (HTTP-only cookie, 7 days)
3. Client sends access token in Authorization header
4. On expiry, client uses refresh token to get new access token
5. Logout invalidates refresh token
```

### Authorization Model: RBAC + Permissions

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| `owner` | Full access | All |
| `admin` | Administrative access | All except billing/tenant settings |
| `sales_manager` | Sales team lead | CRM, leads, quotations, reports (sales) |
| `sales` | Sales representative | CRM, leads, quotations (own) |
| `operations_manager` | Operations lead | Bookings, calendar, tasks, staff, vendors, inventory |
| `coordinator` | Event coordinator | Tasks (assigned), calendar (view), bookings (view) |
| `finance` | Accounts | Invoices, payments, expenses, reports (finance) |
| `marketing` | Marketing (Phase 1) | Lead source visibility, event content library |
| `viewer` | Read-only | View-only across assigned modules |

Permissions are granular: `leads:read`, `leads:write`, `leads:assign`, `quotations:approve`, etc.

Authorization checked at application layer, not just API layer.

---

## Domain Events

Modules communicate side effects via domain events. In Phase 1, handlers produce **suggestions, recommendations, and in-app alerts** — not automatic business execution. See **Phase 1 Automation Policy** and **ADR-017** ([`12-architecture-decisions.md`](./12-architecture-decisions.md)).

*Resolved per ADR-017: suggestion aggregate, accept/dismiss lifecycle, and handler prohibitions documented.*

### Event Flow (Phase 1)

```
Aggregate state change → Domain Event raised → Event Bus (in-process)
                                                      │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                    Calendar Module             Task Module              In-app Alert
                    (suggest milestone)       (suggest checklist)      (notify assignee)
                              │                        │                        │
                              └────────────────────────┴────────────────────────┘
                                              Human confirms → business action
```

Handlers **must not** auto-create assignments, send customer/vendor messages, approve changes, or advance execution stages without explicit user action.

### Event Store

Phase 1: In-process event bus (handlers run after-commit; suggestions persisted for user review).

Future: Outbox pattern — events written to `outbox` table, processed by background worker. Enables reliable async processing and future event sourcing.

### Event Schema

```typescript
interface DomainEvent {
  eventId: string;        // UUID
  eventType: string;      // e.g., "quotation.approved"
  aggregateId: string;    // e.g., quotation ID
  aggregateType: string;  // e.g., "Quotation"
  tenantId: string;
  payload: Record<string, unknown>;
  occurredAt: string;     // ISO 8601
  version: number;        // Schema version
}
```

---

## API Architecture

REST API with resource-oriented URLs. See [18-api-standards.md](./18-api-standards.md).

```
/api/v1/leads
/api/v1/leads/:id
/api/v1/quotations
/api/v1/bookings
/api/v1/bookings/:id/workspace
/api/v1/calendar
/api/v1/tasks
/api/v1/staff
/api/v1/vendors
/api/v1/inventory
/api/v1/finance/payments
/api/v1/finance/expenses
/api/v1/dashboards/founder
...
```

- Versioned (`/v1/`) from day one.
- OpenAPI 3.1 specification generated from code or maintained alongside.
- Consistent error format, pagination, filtering.

---

## Frontend Architecture

### Structure

```
Single Page Application (React)
├── App shell (layout, navigation, auth)
├── Feature modules (mirror backend modules)
│   ├── leads/
│   ├── quotations/
│   ├── bookings/          # includes event workspace
│   ├── tasks/
│   ├── staff/
│   ├── vendors/
│   ├── inventory/
│   ├── finance/
│   └── dashboards/        # founder KPI only (Phase 1)
├── Shared components (design system)
├── API client layer (typed, generated from OpenAPI)
└── State management (React Query for server state, Zustand for UI state)
```

### Key Decisions

- **Server state** managed by TanStack Query (React Query) — caching, invalidation, optimistic updates.
- **UI state** managed by Zustand or React context — sidebar, modals, filters.
- **No Redux** — unnecessary complexity for this application profile.
- **Route-based code splitting** — each module lazy-loaded.

---

## Background Processing

| Job Type | Phase 1 examples | Implementation |
|----------|------------------|----------------|
| **In-app alerts** | Task due, approval pending, movement state reminder | Queue worker |
| **Scheduled** | Quote expiry check, overdue payment reminder (in-app) | Cron scheduler |
| **Integrations** | Website lead intake, payment webhook processing | Queue worker |

**Not Phase 1:** AI quote generation, lead scoring, WhatsApp auto-send, Instagram sync — deferred per **Deferred Scope (Not Phase 1)**.

Redis + BullMQ for job queue. Jobs are idempotent and include org context for scoping.

---

## File Storage

| Content Type | Storage | Access |
|--------------|---------|--------|
| Quotation PDFs | Object storage | Signed URLs, tenant-scoped paths |
| Client documents | Object storage | Signed URLs |
| Staff/vendor attachments | Object storage | Signed URLs |
| Event decor content library (Phase 1) | Object storage | Signed URLs, linked to booking |
| Tenant branding (logo) | Object storage | CDN-backed public URL |

Path convention: `{tenantId}/{module}/{entityId}/{filename}`

---

## Caching Strategy

| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| Tenant settings | Redis | 5 min | On settings update |
| User permissions | Redis | 5 min | On role change |
| Founder KPI dashboard aggregations (Phase 1 BI only) | Redis | 1 min | On related data change |
| Static assets | CDN | Long | Content hash |

**Default: no caching.** Add caching when measurement shows need. Premature caching causes stale data bugs.

---

## Error Handling

### Error Categories

| Category | HTTP Status | Handling |
|----------|-------------|----------|
| Validation error | 400 | Field-level error messages |
| Authentication | 401 | Redirect to login |
| Authorization | 403 | Permission denied message |
| Not found | 404 | Resource not found |
| Conflict | 409 | Business rule violation (e.g., double booking) |
| Internal error | 500 | Logged, generic message to client |

### Error Response Format

```json
{
  "error": {
    "code": "QUOTATION_NOT_EDITABLE",
    "message": "Quotation cannot be edited after it has been sent.",
    "details": [],
    "requestId": "req_abc123"
  }
}
```

Every error includes a `requestId` for correlation with server logs.

---

## Observability

| Concern | Tool | Purpose |
|---------|------|---------|
| **Logging** | Structured JSON logs (pino) | Debugging, audit |
| **Error tracking** | Sentry | Exception monitoring |
| **Metrics** | Application metrics (Prometheus-compatible) | Performance monitoring |
| **Uptime** | External health check | Availability alerting |
| **Audit trail** | Database audit log table | Compliance, debugging |

### Health Endpoints

```
GET /health        → Basic liveness (app is running)
GET /health/ready  → Readiness (DB connected, Redis connected)
```

---

## Security Architecture Summary

Detailed in [14-security-principles.md](./14-security-principles.md). Key points:

- TLS everywhere
- JWT with short expiry + refresh rotation
- Input validation on all endpoints
- SQL injection prevention via parameterized queries (ORM)
- XSS prevention via React's default escaping + CSP headers
- CSRF protection on cookie-based endpoints
- Rate limiting on auth endpoints
- Audit logging for sensitive operations

---

## Deployment Architecture (Initial)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CDN /     │     │  App Server │     │  PostgreSQL │
│   Static    │────▶│  (Node.js)  │────▶│  (Managed)  │
│   Assets    │     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │  (Managed)  │
                    └─────────────┘
```

Single app server initially. Scale horizontally behind load balancer when needed. See [16-deployment-strategy.md](./16-deployment-strategy.md).

---

## Evolution Path

| Phase | Architecture Change | Trigger |
|-------|--------------------|---------|
| Phase 1 | Modular monolith, single server | Launch |
| Phase 2 | Add read replica, background worker process | >100 concurrent users |
| Phase 3 | Horizontal app scaling, Redis cluster | >500 concurrent users |
| Phase 4 | Extract AI module to separate service | AI workload impacts API latency |
| Phase 5 | Multi-region deployment | International tenants |

Each phase is triggered by measured need, not anticipation.

*Note: The **Evolution Path** table above describes **infrastructure scaling** phases — not the product roadmap phases in [`11-roadmap.md`](./11-roadmap.md).*

---

## Phase 1 Architecture Alignment Review

*Review date: 2026-07-08. Alignment-only — no architecture redesign, no technology changes, no business requirement changes.*

### Status

**Addressed (documentation alignment applied 2026-07-08)**

P0 follow-ups from this review have been incorporated into the sections above. **A10** and **A11** resolved via ADR-016 and ADR-017 (2026-07-08). Remaining P2 follow-ups listed in **Phase 1 Architecture Alignment Update** below.

---

### 1. Phase 1 capability support

#### Core

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Unified event record | EP1-AUT-006 | **PASS** (pattern) / **GAP** (doc) | Lead → Quotation → Booking chain fits modular monolith; document does not name unified event lifecycle or `EP1-AUT-006` |
| Event workspace | EP1-OPS-001 | **GAP** | Architecture Overview diagram lists Booking module only — no event operations workspace concept (`06` maps workspace to Booking) |
| Execution stages | EP1-OPS-004 | **GAP** | Not referenced; pipeline implied via Booking status only |
| Task/checklist tracking | EP1-OPS-003 | **PASS** (pattern) / **GAP** (doc) | Task module in layering; domain-event example shows task generation — checklists not distinguished from generic tasks |

#### Operations

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Staff management | EP1-STF-001, 002 | **GAP** | Staff module absent from Architecture Overview diagram and API resource list |
| Staff permissions | EP1-STF-003 | **PASS** (pattern) / **RISK** | RBAC + granular permissions support movement permissions; roles include deferred `marketing` → CMS/Instagram scope |
| Vendor procurement | EP1-VEN-001 – 006 | **GAP** | Vendor module not shown in overview diagram or `/api/v1` examples |
| Inventory movement workflow | EP1-INV-003 – 007 | **GAP** | Inventory module not shown; no movement state machine in architecture narrative |

#### Finance

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Payments | EP1-FIN-003 | **GAP** | Finance module not in overview diagram or API list |
| Payment proofs | EP1-FIN-003 | **PASS** | Object storage + signed URLs support proof attachments |
| Expenses | EP1-FIN-004 | **GAP** | Not referenced in architecture layers |
| Event profitability | EP1-FIN-005, KPI-004 | **GAP** | Dashboard aggregation caching mentioned; founder KPI / per-event P&L not scoped to Phase 1 BI partial module |

#### Customer

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Communication timeline | EP1-CUS-002 | **GAP** | CRM module present; per-event timeline not described |
| Issue notes | EP1-CUS-004 | **GAP** | Not described |
| Review tracking | EP1-CUS-003 | **GAP** | Not described; LM reuse not documented |

#### Marketing

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Event-linked decor content library | EP1-MKT-003 | **PASS** (pattern) / **GAP** (doc) | File storage supports media; event-linked library adjunct not named (not full CMS) |
| Lead source funnel visibility | EP1-MKT-001, 002 | **GAP** | BI/founder dashboard not in architecture overview |

#### Automation

| Capability | EP1 refs | Verdict | Finding |
|------------|----------|---------|---------|
| Approval gates | EP1-AUT-005 | **RISK** | Authorization model exists; **approval gates for suggestions** not documented; domain-event handlers imply automatic side effects |
| Human-approved recommendations | EP1-AUT-001 – 004 | **RISK** | AI background jobs and quote generation listed without human-confirmation requirement |
| No auto-execution | EP1-AUT-001 | **GAP** | Not stated in architecture; event flow diagram shows automatic calendar/task/notification handlers |

---

### 2. Deferred scope isolation

| Deferred item | Phase 1 blocker? | Verdict | Finding |
|---------------|------------------|---------|---------|
| Multi-tenant SaaS | Should not block | **RISK** | Tenancy section centres on multi-tenant `tenant_id` everywhere; cross-tenant tests mandatory — conflicts with single-tenant Phase 1 (`19`, `20` DoD). Pattern usable with one tenant; doc reads as SaaS-first |
| Advanced AI | Should not block | **RISK** | AI Provider in diagram; AI jobs in background processing — may imply Phase 1 dependency |
| Full WhatsApp replacement | Should not block | **RISK** | WhatsApp in stack + infrastructure adapters; external WhatsApp continues per `19` — adapter must be optional/deferred |
| Client portal | Should not block | **PASS** | Marked **Future** in client diagram |
| Full CMS | Should not block | **RISK** | RBAC `marketing` role includes CMS/Instagram/SEO — deferred modules appear in auth model |
| Advanced BI | Should not block | **RISK** | Dashboard caching generic; no distinction between Phase 1 founder KPIs vs advanced BI |
| Full accounting ERP | Should not block | **PASS** | Not described as Phase 1 architecture requirement |

---

### 3. Existing system transition

| System | Expected (`19`, `11`) | Verdict | Finding |
|--------|----------------------|---------|---------|
| Lead Management Application | Extend/reuse — do not rebuild | **GAP** | No mention of LM migration, parallel operation, or porting patterns |
| Quotation/Billing Application | Parallel-run during transition | **GAP** | No transitional integration or cutover narrative |
| We Decor Website | Lead integration; SEO continues | **GAP** | No public intake / website → lead endpoint pattern documented |

---

### 4. Summary findings register

| ID | Verdict | Area | Summary |
|----|---------|------|---------|
| A1 | **PASS** | Platform pattern | Modular monolith + PostgreSQL + object storage + RBAC supports Phase 1 module set per `06` |
| A2 | **GAP** | Module visibility | Overview diagram and API list omit Staff, Vendor, Inventory, Finance, BI (Phase 1 modules) |
| A3 | **GAP** | Unified event / workspace | Booking-as-event-hub and execution stages not documented |
| A4 | **GAP** | Automation policy | No auto-execution and human-approval gate pattern absent from event flow |
| A5 | **GAP** | Legacy transition | LM / QB / website transitional integrations not documented |
| A6 | **RISK** | Tenancy | Multi-tenant narrative may drive premature SaaS complexity (single We Decor tenant Phase 1) |
| A7 | **RISK** | AI / WhatsApp | Stack and background jobs list may encourage deferred scope in Phase 1 builds |
| A8 | **RISK** | Domain events | Handler example auto-creates calendar/tasks/notifications — conflicts with `EP1-AUT-001` unless gated |
| A9 | **RISK** | RBAC roles | Roles reference CMS, Instagram, marketing platform — deferred from Phase 1 |
| A10 | **RESOLVED** | Tenancy Phase 1 | ADR-016 — full plumbing, single seeded We Decor tenant |
| A11 | **RESOLVED** | Event handlers | ADR-017 — suggestion-only handlers; accept via application service |

---

### Required follow-ups

*Documentation alignment only — implement via architecture doc addenda, ADRs, or `06`/`11` cross-references. No redesign required.*

| Priority | Follow-up | Addresses |
|----------|-----------|-----------|
| **P0** | Add **Phase 1 module inventory** to Architecture Overview (Staff, Vendor, Inventory, Finance, BI-founder, File) matching `06` | A2 |
| **P0** | Document **unified event record** and **event workspace** as Booking-module responsibilities with execution stages | A3 |
| **P0** | Add **Phase 1 automation policy** section: recommendation-only handlers, approval gates, no auto-execution (`EP1-AUT-001`, `005`) | A4, A8 |
| **P0** | Add **Transitional integrations** subsection: LM extend, QB parallel-run, website lead intake | A5 |
| **P1** | Clarify **Phase 1 tenancy mode**: single We Decor tenant; defer cross-tenant isolation / RLS to Phase 6 SaaS | A6, A10 — **Done** (ADR-016) |
| **P1** | Mark **AI Provider**, **WhatsApp adapter**, **Client Portal** as deferred in diagrams/stack table for Phase 1 | A7 |
| **P1** | Scope **RBAC roles** to Phase 1 modules; note CMS/Instagram roles as Phase 4+ | A9 |
| **P1** | Distinguish **Phase 1 founder KPI dashboard** (partial BI) from advanced BI in caching/observability sections | A7 |
| **P2** | Extend API architecture example routes for `/staff`, `/vendors`, `/inventory`, `/finance`, `/dashboards` | A2 |
| **P2** | ADR: domain-event handler behaviour in Phase 1 (suggest vs auto-execute) | A8, A11 — **Done** (ADR-017) |

### Reference documents

| Document | Role |
|----------|------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | Approved Phase 1 scope, EP1 IDs, UAT |
| [`06-module-design.md`](./06-module-design.md) | Phase 1 module coverage (realigned) |
| [`11-roadmap.md`](./11-roadmap.md) | Phase 1 delivery scope (realigned) |
| [`20-definition-of-done.md`](./20-definition-of-done.md) | Phase 1 done criteria (realigned) |

---

## Phase 1 Architecture Alignment Update

*Applied: 2026-07-08. Doc `19` remains business source of truth. No technology stack changes, no architecture redesign, no new features.*

### Changes applied

| # | Item | Section updated |
|---|------|-----------------|
| 1 | **Phase 1 module inventory** | `Phase 1 Module Inventory` — Core, Sales, Customer, Operations, Staff, Vendor, Inventory, Finance, Marketing, BI |
| 2 | **Unified event record** | `Unified Event Record` — Lead → Quotation → Approved Event → Workspace → Execution → Completion; operational source of truth |
| 3 | **Event workspace** | `Event Workspace` — execution stages, tasks/checklists, staff/vendor/inventory links, financial visibility |
| 4 | **Automation policy** | `Phase 1 Automation Policy` — suggestions/recommendations/alerts only; no auto-execution; human approval required |
| 5 | **Transitional integrations** | `Transitional Integrations` — LM extend (no rebuild), QB parallel-run, website lead capture |
| 6 | **Deferred scope marking** | `Deferred Scope (Not Phase 1)` + overview diagram + background jobs + stack note |
| 7 | **Tenancy + domain events** | `Tenancy Model`, `Domain Events` — ADR-016, ADR-017 applied |
| 8 | **Supporting updates** | Architecture overview diagram, API routes, RBAC marketing role, caching label, file storage |

### Remaining decisions

*None — A10 and A11 resolved 2026-07-08 (ADR-016, ADR-017).*

### Remaining follow-ups (non-blocking)

| Priority | Item |
|----------|------|
| P2 | Expand OpenAPI spec to match Phase 1 API route examples |
| P2 | Deepen `06-module-design.md` feature specs for greenfield modules (workspace, movement FSM, procurement) |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [`docs/business/19-event-os-phase1-requirements.md`](../docs/business/19-event-os-phase1-requirements.md) | **Authoritative Phase 1 business baseline** |
| [06-module-design.md](./06-module-design.md) | Module boundaries and interfaces |
| [11-roadmap.md](./11-roadmap.md) | Phase 1 delivery timeline |
| [20-definition-of-done.md](./20-definition-of-done.md) | Phase 1 completion criteria |
| [07-database-philosophy.md](./07-database-philosophy.md) | Data layer design |
| [10-folder-structure.md](./10-folder-structure.md) | Code organization |
| [12-architecture-decisions.md](./12-architecture-decisions.md) | ADRs |
| [14-security-principles.md](./14-security-principles.md) | Security details |
| [16-deployment-strategy.md](./16-deployment-strategy.md) | Deployment pipeline |

---

*Last updated: 2026-07-08*  
*Owner: Founding Engineering*  
*Phase 1 alignment: review + update applied (`19`, `06`, `11`, `20`) — 2026-07-08*
