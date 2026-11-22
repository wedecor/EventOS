# M5-01 migration note — Enquiries bridge

Migration: `20261123120000_m5_01_enquiries_bridge`
Follows: `20261112070000_m4_ai_executions`

## What it does

| Change | Type | Reversible without data loss? |
|---|---|---|
| `users.disabled_at TIMESTAMP NULL` | add column | yes |
| `customers.phone_normalized TEXT NULL` | add column | yes |
| `customers.external_managed BOOLEAN NOT NULL DEFAULT false` | add column | yes |
| `customers` unique `(tenant_id, phone_normalized)` | add unique index (NULLs are distinct in PG) | yes |
| `customers` index `(tenant_id, display_name)` | add non-unique index | yes |
| **`customers` unique `(tenant_id, display_name)`** | **drop unique index** | constraint relaxed only; no rows change |
| `events.quotation_id` | `DROP NOT NULL` (still `UNIQUE`; FK kept) | yes while no NULL rows exist |
| `events.source TEXT NOT NULL DEFAULT 'eventos'` | add column | yes |
| `events.external_ref TEXT NULL` | add column | yes |
| `event_functions` | new table | yes (drop table) |
| `external_identities` | new table | yes (drop table) |
| `external_record_links` | new table | yes (drop table) |

All changes are additive or relax a constraint. No data is rewritten, deleted or
back-filled. Existing customers keep `phone_normalized = NULL` until they are next
edited or matched by the feed (the feed also falls back to `primary_phone` equality
and then adopts the normalised value).

## Why the display-name unique index is dropped

ADR-019 / M5-01 §3c.4: two customers may legitimately share a name (feed-created
customers are matched on phone, then email). Application code that relied on the
unique index (`createCustomer` duplicate detection) was changed to detect duplicates
on phone / email only.

## Rollback

Rolling back after the feed has created data is lossy. Before any feed delivery
(no `events.quotation_id IS NULL`, no synced rows):

```sql
DROP TABLE "external_record_links";
DROP TABLE "external_identities";
DROP TABLE "event_functions";
ALTER TABLE "events" DROP COLUMN "external_ref", DROP COLUMN "source";
ALTER TABLE "events" ALTER COLUMN "quotation_id" SET NOT NULL;
DROP INDEX "customers_tenant_id_phone_normalized_key";
DROP INDEX "customers_tenant_id_display_name_idx";
ALTER TABLE "customers" DROP COLUMN "phone_normalized", DROP COLUMN "external_managed";
CREATE UNIQUE INDEX "customers_tenant_id_display_name_key" ON "customers"("tenant_id", "display_name");
ALTER TABLE "users" DROP COLUMN "disabled_at";
```

Re-creating the display-name unique index fails if duplicates have since been created.
Prefer roll-forward; use Cloud SQL PITR for a true restore.

## Verification performed

* Generated with `prisma migrate diff` (old schema → new schema).
* Applied on top of all earlier migrations to a throw-away local database
  (`prisma migrate deploy`) and diffed back against `schema.prisma`: no drift in the
  objects touched by this migration. (Pre-existing index-rename/default noise from
  earlier migrations is unrelated.)
* Not applied to any staging/production database.

## Deploy order

Run `prisma migrate deploy` through the `eventos-migrate` Cloud Run Job **before** the
new API revision receives traffic (see `infrastructure/gcp/README.md`). The previous
API revision keeps working against the new schema (all new columns are nullable or
defaulted), so rollback of the application revision is safe.
