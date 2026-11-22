-- P2-01 Event Workspace Expansion: Task operational fields + EventNote

CREATE TYPE "task_category" AS ENUM (
  'general',
  'pre_event',
  'dayheets',
  'vendor',
  'inventory',
  'venue',
  'wrap_up'
);

CREATE TYPE "task_priority" AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

ALTER TABLE "tasks"
  ADD COLUMN "category" "task_category" NOT NULL DEFAULT 'general',
  ADD COLUMN "priority" "task_priority" NOT NULL DEFAULT 'medium',
  ADD COLUMN "completion_notes" TEXT;

CREATE INDEX "tasks_tenant_id_category_idx" ON "tasks"("tenant_id", "category");

CREATE TABLE "event_notes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_by_user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "event_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_notes_tenant_id_booking_id_created_at_idx"
  ON "event_notes"("tenant_id", "booking_id", "created_at");

ALTER TABLE "event_notes"
  ADD CONSTRAINT "event_notes_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_notes"
  ADD CONSTRAINT "event_notes_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_notes"
  ADD CONSTRAINT "event_notes_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
