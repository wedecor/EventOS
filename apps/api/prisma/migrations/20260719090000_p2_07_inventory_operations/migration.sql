-- P2-07 — Inventory operations enhancements (additive)

ALTER TYPE "inventory_movement_status" ADD VALUE 'packing_started';
ALTER TYPE "inventory_movement_status" ADD VALUE 'verified';
ALTER TYPE "inventory_movement_status" ADD VALUE 'ready_for_dispatch';
ALTER TYPE "inventory_movement_status" ADD VALUE 'dispatched';
ALTER TYPE "inventory_movement_status" ADD VALUE 'return_verified';
ALTER TYPE "inventory_movement_status" ADD VALUE 'cancelled';

CREATE TYPE "inventory_reservation_status" AS ENUM ('reserved', 'released', 'cancelled');
CREATE TYPE "inventory_verification_result" AS ENUM ('pass', 'fail', 'partial');
CREATE TYPE "inventory_damage_type" AS ENUM ('breakage', 'loss', 'water_damage', 'wear', 'other');
CREATE TYPE "inventory_damage_severity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE "inventory_reservations" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "inventory_item_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" "inventory_reservation_status" NOT NULL DEFAULT 'reserved',
  "notes" TEXT,
  "vendor_procurement_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "inventory_movements"
  ADD COLUMN IF NOT EXISTS "reservation_id" UUID,
  ADD COLUMN IF NOT EXISTS "packed_by_user_id" UUID,
  ADD COLUMN IF NOT EXISTS "packing_started_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verification_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "ready_for_dispatch_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "vehicle" TEXT,
  ADD COLUMN IF NOT EXISTS "driver_name" TEXT,
  ADD COLUMN IF NOT EXISTS "dispatched_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "returned_quantity" INTEGER,
  ADD COLUMN IF NOT EXISTS "missing_quantity" INTEGER,
  ADD COLUMN IF NOT EXISTS "damaged_quantity" INTEGER,
  ADD COLUMN IF NOT EXISTS "return_verification_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "return_verified_at" TIMESTAMP(3);

CREATE TABLE "inventory_verifications" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "movement_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "expected_quantity" INTEGER NOT NULL,
  "actual_quantity" INTEGER NOT NULL,
  "difference" INTEGER NOT NULL,
  "result" "inventory_verification_result" NOT NULL,
  "notes" TEXT,
  "verified_at" TIMESTAMP(3) NOT NULL,
  "verified_by_user_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_damage_reports" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "movement_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "inventory_item_id" UUID,
  "damage_type" "inventory_damage_type" NOT NULL,
  "severity" "inventory_damage_severity" NOT NULL DEFAULT 'medium',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "notes" TEXT,
  "photo_name" TEXT,
  "photo_mime_type" TEXT,
  "photo_size_bytes" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_damage_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_reservations_tenant_id_booking_id_idx"
  ON "inventory_reservations"("tenant_id", "booking_id");
CREATE INDEX "inventory_reservations_tenant_id_inventory_item_id_status_idx"
  ON "inventory_reservations"("tenant_id", "inventory_item_id", "status");
CREATE INDEX "inventory_movements_tenant_id_reservation_id_idx"
  ON "inventory_movements"("tenant_id", "reservation_id");
CREATE INDEX "inventory_verifications_tenant_id_movement_id_idx"
  ON "inventory_verifications"("tenant_id", "movement_id");
CREATE INDEX "inventory_verifications_tenant_id_booking_id_idx"
  ON "inventory_verifications"("tenant_id", "booking_id");
CREATE INDEX "inventory_damage_reports_tenant_id_movement_id_idx"
  ON "inventory_damage_reports"("tenant_id", "movement_id");
CREATE INDEX "inventory_damage_reports_tenant_id_booking_id_idx"
  ON "inventory_damage_reports"("tenant_id", "booking_id");

ALTER TABLE "inventory_reservations"
  ADD CONSTRAINT "inventory_reservations_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations"
  ADD CONSTRAINT "inventory_reservations_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations"
  ADD CONSTRAINT "inventory_reservations_inventory_item_id_fkey"
  FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations"
  ADD CONSTRAINT "inventory_reservations_vendor_procurement_id_fkey"
  FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_reservation_id_fkey"
  FOREIGN KEY ("reservation_id") REFERENCES "inventory_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_packed_by_user_id_fkey"
  FOREIGN KEY ("packed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_verifications"
  ADD CONSTRAINT "inventory_verifications_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_verifications"
  ADD CONSTRAINT "inventory_verifications_movement_id_fkey"
  FOREIGN KEY ("movement_id") REFERENCES "inventory_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_verifications"
  ADD CONSTRAINT "inventory_verifications_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_verifications"
  ADD CONSTRAINT "inventory_verifications_verified_by_user_id_fkey"
  FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_damage_reports"
  ADD CONSTRAINT "inventory_damage_reports_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_damage_reports"
  ADD CONSTRAINT "inventory_damage_reports_movement_id_fkey"
  FOREIGN KEY ("movement_id") REFERENCES "inventory_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_damage_reports"
  ADD CONSTRAINT "inventory_damage_reports_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_damage_reports"
  ADD CONSTRAINT "inventory_damage_reports_inventory_item_id_fkey"
  FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
