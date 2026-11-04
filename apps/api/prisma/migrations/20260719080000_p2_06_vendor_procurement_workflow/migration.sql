-- P2-06 — Vendor procurement workflow (additive)

ALTER TYPE "procurement_line_status" ADD VALUE 'cancelled';

CREATE TYPE "vendor_procurement_workflow_status" AS ENUM (
  'draft',
  'quotation_requested',
  'quotation_received',
  'approved',
  'purchase_ordered',
  'vendor_confirmed',
  'materials_delivered',
  'completed',
  'cancelled'
);

CREATE TYPE "procurement_delivery_status" AS ENUM (
  'pending',
  'partial',
  'delivered',
  'cancelled'
);

CREATE TYPE "procurement_quote_status" AS ENUM (
  'submitted',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE "purchase_order_status" AS ENUM (
  'draft',
  'issued',
  'cancelled'
);

CREATE TYPE "procurement_timeline_event_type" AS ENUM (
  'request_created',
  'quote_requested',
  'quote_received',
  'approved',
  'po_issued',
  'vendor_confirmed',
  'delivered',
  'completed',
  'cancelled',
  'note_added'
);

ALTER TABLE "vendors"
  ADD COLUMN IF NOT EXISTS "procurement_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "on_time_delivery_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "completed_procurement_count" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "vendor_procurements"
  ADD COLUMN IF NOT EXISTS "workflow_status" "vendor_procurement_workflow_status" NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "service_category" TEXT,
  ADD COLUMN IF NOT EXISTS "required_date" DATE,
  ADD COLUMN IF NOT EXISTS "estimated_cost" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "approved_cost" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "actual_cost" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "delivery_status" "procurement_delivery_status" NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "delivery_notes" TEXT;

-- Backfill workflow from legacy Phase 1 header status
UPDATE "vendor_procurements"
SET "workflow_status" = CASE "status"::text
  WHEN 'planned' THEN 'draft'::"vendor_procurement_workflow_status"
  WHEN 'requested' THEN 'quotation_requested'::"vendor_procurement_workflow_status"
  WHEN 'confirmed' THEN 'vendor_confirmed'::"vendor_procurement_workflow_status"
  WHEN 'delivered' THEN 'materials_delivered'::"vendor_procurement_workflow_status"
  WHEN 'completed' THEN 'completed'::"vendor_procurement_workflow_status"
  WHEN 'cancelled' THEN 'cancelled'::"vendor_procurement_workflow_status"
  ELSE 'draft'::"vendor_procurement_workflow_status"
END;

CREATE INDEX IF NOT EXISTS "vendor_procurements_tenant_id_workflow_status_idx"
  ON "vendor_procurements"("tenant_id", "workflow_status");

CREATE TABLE "procurement_quotes" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "vendor_procurement_id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "valid_until" DATE,
  "notes" TEXT,
  "attachment_name" TEXT,
  "attachment_mime_type" TEXT,
  "attachment_size_bytes" INTEGER,
  "status" "procurement_quote_status" NOT NULL DEFAULT 'submitted',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "procurement_quotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_orders" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "vendor_procurement_id" UUID NOT NULL,
  "vendor_id" UUID NOT NULL,
  "po_number" TEXT NOT NULL,
  "issue_date" DATE NOT NULL,
  "total_amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "notes" TEXT,
  "status" "purchase_order_status" NOT NULL DEFAULT 'draft',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_timeline_events" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "vendor_procurement_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "event_type" "procurement_timeline_event_type" NOT NULL,
  "message" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procurement_timeline_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "procurement_quotes_tenant_id_vendor_procurement_id_idx"
  ON "procurement_quotes"("tenant_id", "vendor_procurement_id");
CREATE INDEX "procurement_quotes_tenant_id_vendor_id_idx"
  ON "procurement_quotes"("tenant_id", "vendor_id");
CREATE UNIQUE INDEX "purchase_orders_tenant_id_po_number_key"
  ON "purchase_orders"("tenant_id", "po_number");
CREATE INDEX "purchase_orders_tenant_id_vendor_procurement_id_idx"
  ON "purchase_orders"("tenant_id", "vendor_procurement_id");
CREATE INDEX "procurement_timeline_events_tenant_id_vendor_procurement_id_occurred_at_idx"
  ON "procurement_timeline_events"("tenant_id", "vendor_procurement_id", "occurred_at");
CREATE INDEX "procurement_timeline_events_tenant_id_booking_id_occurred_at_idx"
  ON "procurement_timeline_events"("tenant_id", "booking_id", "occurred_at");

ALTER TABLE "procurement_quotes"
  ADD CONSTRAINT "procurement_quotes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procurement_quotes"
  ADD CONSTRAINT "procurement_quotes_vendor_procurement_id_fkey"
  FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_quotes"
  ADD CONSTRAINT "procurement_quotes_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_vendor_procurement_id_fkey"
  FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_vendor_id_fkey"
  FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procurement_timeline_events"
  ADD CONSTRAINT "procurement_timeline_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procurement_timeline_events"
  ADD CONSTRAINT "procurement_timeline_events_vendor_procurement_id_fkey"
  FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_timeline_events"
  ADD CONSTRAINT "procurement_timeline_events_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed timeline for existing procurements
INSERT INTO "procurement_timeline_events" (
  "id", "tenant_id", "vendor_procurement_id", "booking_id", "event_type", "message", "occurred_at", "created_at"
)
SELECT
  gen_random_uuid(),
  vp."tenant_id",
  vp."id",
  vp."booking_id",
  'request_created'::"procurement_timeline_event_type",
  'Procurement request created',
  vp."created_at",
  CURRENT_TIMESTAMP
FROM "vendor_procurements" vp;
