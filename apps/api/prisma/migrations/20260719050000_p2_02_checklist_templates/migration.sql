-- P2-02 Checklist Templates & Event Checklists

CREATE TYPE "checklist_template_status" AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE "checklist_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "event_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "category" "task_category" NOT NULL DEFAULT 'general',
  "status" "checklist_template_status" NOT NULL DEFAULT 'active',
  "template_version" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "root_template_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checklist_templates_tenant_id_status_idx"
  ON "checklist_templates"("tenant_id", "status");
CREATE INDEX "checklist_templates_tenant_id_root_template_id_template_version_idx"
  ON "checklist_templates"("tenant_id", "root_template_id", "template_version");
CREATE INDEX "checklist_templates_tenant_id_category_idx"
  ON "checklist_templates"("tenant_id", "category");

ALTER TABLE "checklist_templates"
  ADD CONSTRAINT "checklist_templates_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "checklist_template_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "default_assignee_role" TEXT,
  "estimated_duration_minutes" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "checklist_template_items_tenant_id_template_id_sort_order_idx"
  ON "checklist_template_items"("tenant_id", "template_id", "sort_order");

ALTER TABLE "checklist_template_items"
  ADD CONSTRAINT "checklist_template_items_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_checklists" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "template_id" UUID,
  "template_version" INTEGER,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "task_category" NOT NULL DEFAULT 'general',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "event_checklists_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_checklists_tenant_id_booking_id_idx"
  ON "event_checklists"("tenant_id", "booking_id");
CREATE INDEX "event_checklists_tenant_id_template_id_idx"
  ON "event_checklists"("tenant_id", "template_id");

ALTER TABLE "event_checklists"
  ADD CONSTRAINT "event_checklists_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_checklists"
  ADD CONSTRAINT "event_checklists_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_checklists"
  ADD CONSTRAINT "event_checklists_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "event_checklist_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "checklist_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "default_assignee_role" TEXT,
  "estimated_duration_minutes" INTEGER,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "is_completed" BOOLEAN NOT NULL DEFAULT false,
  "completed_at" TIMESTAMP(3),
  "completed_by_user_id" UUID,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "event_checklist_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_checklist_items_tenant_id_checklist_id_sort_order_idx"
  ON "event_checklist_items"("tenant_id", "checklist_id", "sort_order");

ALTER TABLE "event_checklist_items"
  ADD CONSTRAINT "event_checklist_items_checklist_id_fkey"
  FOREIGN KEY ("checklist_id") REFERENCES "event_checklists"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_checklist_items"
  ADD CONSTRAINT "event_checklist_items_completed_by_user_id_fkey"
  FOREIGN KEY ("completed_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
