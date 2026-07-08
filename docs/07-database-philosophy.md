# Database Philosophy

## Purpose of This Document

This document defines how Event OS thinks about data: storage technology, schema design, migration strategy, multi-tenancy, and query patterns. The database is the system's most durable artifact—design it carefully.

---

## Core Philosophy

### 1. PostgreSQL Is the System of Record

All business data lives in PostgreSQL. Redis is for ephemeral data (cache, sessions, queues). Object storage is for blobs (files). No business data in NoSQL, flat files, or application memory.

**Why PostgreSQL:**
- ACID transactions for financial and booking data
- Rich type system (UUID, JSONB, arrays, enums, ranges)
- Full-text search for client/lead search
- Row-Level Security for tenant isolation (defense-in-depth)
- Mature ecosystem, excellent tooling, proven at scale
- Single database simplifies operations for a small team

### 2. Domain Drives Schema

Database tables map to domain aggregates, not UI screens or API endpoints. Table names use the ubiquitous language from [04-business-domain.md](./04-business-domain.md).

| Domain Term | Table Name | Not |
|-------------|------------|-----|
| Client | `clients` | `customers`, `users` |
| Lead | `leads` | `opportunities`, `prospects` |
| Quotation | `quotations` | `quotes`, `proposals` |
| Booking | `bookings` | `orders`, `reservations` |

### 3. Normalize First, Denormalize With Evidence

Start with Third Normal Form (3NF). Denormalize only when:

- A measured query exceeds performance budget
- A read pattern is significantly more frequent than writes
- The denormalized data has a clear invalidation strategy

**Examples of justified denormalization (future):**
- `leads.estimated_value` cached from quotation for pipeline sorting
- Dashboard aggregation tables refreshed by background jobs

### 4. Migrations Are Immutable History

Every schema change is a forward migration. Never edit a migration that has been applied to any environment. Fix mistakes with a new migration.

---

## Multi-Tenancy in the Database

### Row-Level Tenant Isolation

Every tenant-scoped table includes:

```sql
tenant_id UUID NOT NULL REFERENCES tenants(id)
```

### Index Strategy

All tenant-scoped queries include `tenant_id`. Composite indexes lead with `tenant_id`:

```sql
-- Correct: tenant_id first
CREATE INDEX idx_leads_tenant_stage ON leads (tenant_id, stage);
CREATE INDEX idx_leads_tenant_assigned ON leads (tenant_id, assigned_to);
CREATE INDEX idx_quotations_tenant_status ON quotations (tenant_id, status);

-- Incorrect: missing tenant_id
CREATE INDEX idx_leads_stage ON leads (stage);  -- ❌ Full table scan across tenants
```

### Row-Level Security (Phase 2)

PostgreSQL RLS as defense-in-depth:

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

Application sets `app.tenant_id` at connection level. Even if application code has a bug, the database enforces isolation.

---

## Schema Design Conventions

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `quotation_line_items` |
| Columns | snake_case | `created_at`, `tenant_id` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `{referenced_table_singular}_id` | `client_id`, `booking_id` |
| Indexes | `idx_{table}_{columns}` | `idx_leads_tenant_stage` |
| Enums | snake_case type name | `lead_stage`, `quotation_status` |
| Timestamps | `created_at`, `updated_at` | Always UTC (`TIMESTAMPTZ`) |
| Soft delete | `deleted_at TIMESTAMPTZ` | NULL = active |
| Boolean | `is_{adjective}` or `has_{noun}` | `is_primary`, `has_tax` |

### Standard Columns

Every table includes:

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id   UUID NOT NULL REFERENCES tenants(id),  -- if tenant-scoped
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
deleted_at  TIMESTAMPTZ                          -- if soft-deletable
```

### UUIDs over Auto-Increment

**Why UUIDs:**
- No sequential ID leakage across tenants
- Safe to generate client-side (useful for optimistic UI)
- Merge-friendly for future data migration
- No coordination needed across services (future-proofing)

**Human-readable numbers** (quotation number, booking number, invoice number) are separate columns with tenant-scoped sequences:

```sql
quotation_number VARCHAR(20) NOT NULL,  -- "QT-2026-0042"
-- Unique per tenant:
UNIQUE (tenant_id, quotation_number)
```

### Money Storage

Never use `FLOAT` or `DOUBLE`. Store money as:

```sql
amount   DECIMAL(19, 4) NOT NULL,
currency CHAR(3) NOT NULL DEFAULT 'INR'  -- ISO 4217
```

Four decimal places accommodate currencies with sub-cent precision. Display rounds to 2 decimal places per locale.

### Enum Strategy

Use PostgreSQL native enums for stable, well-defined status fields:

```sql
CREATE TYPE lead_stage AS ENUM (
  'new', 'contacted', 'qualified', 'site_visit_scheduled',
  'site_visit_completed', 'quoted', 'won', 'lost'
);
```

For tenant-configurable enumerations (custom pipeline stages), use a `varchar` column with validation in the application layer against tenant configuration.

### JSONB Usage

Use JSONB for:
- Tenant settings (flexible configuration)
- Metadata and extensible attributes
- Audit log payloads
- AI conversation context

Do **not** use JSONB for:
- Core relational data (clients, line items, payments)
- Data that needs foreign key constraints
- Data queried with complex joins

```sql
-- Appropriate JSONB
tenant_settings JSONB NOT NULL DEFAULT '{}'

-- Inappropriate JSONB
line_items JSONB  -- ❌ Use a proper line_items table
```

---

## Table Ownership by Module

Each module owns its tables exclusively. No module queries another module's tables directly.

| Module | Tables |
|--------|--------|
| **Tenant** | `tenants`, `tenant_settings` |
| **Auth** | `users`, `sessions`, `password_reset_tokens`, `roles`, `permissions`, `user_roles` |
| **CRM** | `clients`, `contacts`, `client_interactions` |
| **Lead** | `leads`, `lead_stage_history` |
| **Quotation** | `quotations`, `quotation_line_items` |
| **Booking** | `bookings` |
| **Calendar** | `calendar_entries` |
| **Task** | `tasks`, `task_templates` |
| **Staff** | `staff_members`, `staff_availability` |
| **Vendor** | `vendors`, `vendor_rate_cards`, `vendor_assignments` |
| **Inventory** | `inventory_items`, `inventory_allocations` |
| **Finance** | `invoices`, `invoice_line_items`, `payments`, `expenses` |
| **Notification** | `notifications`, `notification_preferences` |
| **File** | `files` |
| **AI** | `ai_conversations`, `ai_suggestions`, `prompt_templates` |

Cross-module data access goes through application service interfaces, not SQL joins across module boundaries.

**Exception:** Read models and report queries may join across tables for analytics, implemented in the Reports/BI module with explicit documentation.

---

## Key Schema Patterns

### Aggregate Root Table

```sql
CREATE TABLE quotations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  client_id         UUID NOT NULL,  -- Reference to CRM module's clients
  lead_id           UUID,           -- Reference to Lead module's leads
  quotation_number  VARCHAR(20) NOT NULL,
  version           INTEGER NOT NULL DEFAULT 1,
  status            quotation_status NOT NULL DEFAULT 'draft',
  event_type        VARCHAR(100) NOT NULL,
  event_date_start  DATE NOT NULL,
  event_date_end    DATE NOT NULL,
  venue_name        VARCHAR(255),
  subtotal_amount   DECIMAL(19,4) NOT NULL DEFAULT 0,
  subtotal_currency CHAR(3) NOT NULL DEFAULT 'INR',
  discount_amount   DECIMAL(19,4) NOT NULL DEFAULT 0,
  discount_currency CHAR(3) NOT NULL DEFAULT 'INR',
  tax_amount        DECIMAL(19,4) NOT NULL DEFAULT 0,
  tax_currency      CHAR(3) NOT NULL DEFAULT 'INR',
  total_amount      DECIMAL(19,4) NOT NULL DEFAULT 0,
  total_currency    CHAR(3) NOT NULL DEFAULT 'INR',
  valid_until       DATE NOT NULL,
  terms             TEXT,
  notes             TEXT,
  internal_notes    TEXT,
  sent_at           TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ,

  UNIQUE (tenant_id, quotation_number)
);
```

### Child Entity Table

```sql
CREATE TABLE quotation_line_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  quotation_id    UUID NOT NULL REFERENCES quotations(id),
  description     VARCHAR(500) NOT NULL,
  package_id      UUID,
  quantity        DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price      DECIMAL(19,4) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'INR',
  total_amount    DECIMAL(19,4) NOT NULL,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### History / Audit Table

```sql
CREATE TABLE lead_stage_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  lead_id     UUID NOT NULL REFERENCES leads(id),
  from_stage  lead_stage,
  to_stage    lead_stage NOT NULL,
  changed_by  UUID NOT NULL,  -- user_id
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Outbox Table (Phase 2)

```sql
CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  event_type      VARCHAR(100) NOT NULL,
  aggregate_id    UUID NOT NULL,
  aggregate_type  VARCHAR(50) NOT NULL,
  payload         JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_outbox_unprocessed ON outbox_events (created_at)
  WHERE processed_at IS NULL;
```

---

## Migration Strategy

### Tool

Use the ORM's migration tool (Prisma Migrate or Drizzle Kit) for schema migrations. Migrations are SQL files committed to version control.

### Rules

1. **Every schema change is a migration** — No manual DDL in production.
2. **Migrations are forward-only** — Never edit applied migrations; create a new one to fix.
3. **Backward-compatible migrations** — Deployments run migrations before new code. New columns must be nullable or have defaults.
4. **Destructive changes require two steps:**
   - Step 1: Add new column/table, dual-write
   - Step 2: Migrate data, remove old column/table
5. **Test migrations against production-size data** before applying.

### Migration Naming

```
YYYYMMDDHHMMSS_descriptive_name.sql

20260706120000_create_tenants_table.sql
20260706120100_create_clients_table.sql
20260706120200_create_leads_table.sql
```

### Seed Data

Development and staging environments use seed scripts:

- Default tenant (We Decor)
- Admin user
- Sample clients, leads, quotations for testing
- Event templates

Seed scripts are idempotent (safe to run multiple times).

---

## Query Patterns

### Tenant Scoping (Mandatory)

Every query on tenant-scoped tables filters by `tenant_id`:

```sql
-- Application layer enforces this automatically
SELECT * FROM leads
WHERE tenant_id = $1 AND stage = 'new'
ORDER BY created_at DESC
LIMIT 20;
```

### Pagination

Cursor-based pagination for large datasets:

```sql
SELECT * FROM leads
WHERE tenant_id = $1
  AND created_at < $2  -- cursor
ORDER BY created_at DESC
LIMIT 21;  -- Fetch one extra to determine hasNextPage
```

Offset pagination is acceptable for small datasets (< 1000 rows) like settings pages.

### Soft Deletes

Queries exclude soft-deleted records by default:

```sql
WHERE deleted_at IS NULL
```

Admin interfaces may include deleted records with explicit filter.

### Full-Text Search

PostgreSQL `tsvector` for client and lead search:

```sql
ALTER TABLE clients ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(notes, ''))
  ) STORED;

CREATE INDEX idx_clients_search ON clients USING gin(search_vector);
```

---

## Transaction Management

### Unit of Work

Each application service method defines a transaction boundary:

```
createQuotation():
  BEGIN
    → Validate client exists (read)
    → Create quotation (write)
    → Create line items (write)
    → Emit QuotationCreated event
  COMMIT
```

### Cross-Module Transactions

When a use case spans modules (e.g., approve quotation → create booking), the orchestrating application service manages the transaction. Event handlers for side effects (notifications, tasks) run after commit.

### Optimistic Concurrency

Aggregates that are concurrently edited include a `version` column:

```sql
UPDATE quotations
SET status = 'approved', version = version + 1, updated_at = now()
WHERE id = $1 AND version = $2 AND tenant_id = $3;
-- If 0 rows updated → concurrent modification → return 409 Conflict
```

---

## Backup and Recovery

| Aspect | Strategy |
|--------|----------|
| **Backup frequency** | Daily full backup + continuous WAL archiving |
| **Retention** | 30 days daily, 12 months monthly |
| **Recovery target (RPO)** | < 1 hour (WAL archiving) |
| **Recovery time (RTO)** | < 4 hours |
| **Testing** | Monthly restore test to staging environment |
| **Tenant data export** | API endpoint for full tenant data export (GDPR) |

---

## Performance Guidelines

### Connection Pooling

Use PgBouncer or application-level pooling (ORM default). Max connections: `(num_app_instances × pool_size) < postgresql_max_connections`.

### Query Budget

| Query Type | Target |
|------------|--------|
| Single entity by ID | < 5ms |
| List with filters (paginated) | < 50ms |
| Dashboard aggregation | < 200ms |
| Report generation | < 5s (background job if longer) |

### N+1 Prevention

- Use eager loading / joins for known child entity patterns
- DataLoader pattern for GraphQL (if adopted)
- Log slow queries (> 100ms) in development

### Indexing Review

Review query plans for every new feature. Add indexes based on actual query patterns, not anticipated ones.

---

## Data Retention

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| Active business data | Indefinite while tenant active | Soft delete |
| Audit logs | 7 years | Hard delete after retention |
| AI conversations | 1 year | Hard delete |
| Notification history | 90 days | Hard delete |
| Session data | 7 days after expiry | Auto-cleanup |
| File storage | While referenced | Cascade on entity deletion |
| Tenant offboarding | 90 days after cancellation | Full data purge |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [04-business-domain.md](./04-business-domain.md) | Domain aggregates and rules |
| [06-module-design.md](./06-module-design.md) | Table ownership per module |
| [05-system-architecture.md](./05-system-architecture.md) | Database in system context |
| [14-security-principles.md](./14-security-principles.md) | Data security |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
