-- CreateEnum
CREATE TYPE "customer_status" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('individual', 'organization');

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('website', 'instagram', 'whatsapp', 'referral', 'walk_in', 'phone', 'manual', 'other');

-- CreateEnum
CREATE TYPE "lead_stage" AS ENUM ('new', 'in_talks', 'approved', 'completed', 'lost', 'cancelled');

-- CreateEnum
CREATE TYPE "follow_up_status" AS ENUM ('pending', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "quotation_status" AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired', 'superseded');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('approved', 'in_preparation', 'in_execution', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "preparation_status" AS ENUM ('pending', 'ready', 'needs_attention');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "type" "customer_type" NOT NULL DEFAULT 'individual',
    "status" "customer_status" NOT NULL DEFAULT 'active',
    "primary_phone" TEXT,
    "primary_email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "assigned_to_id" UUID,
    "source" "lead_source" NOT NULL,
    "source_detail" TEXT,
    "stage" "lead_stage" NOT NULL DEFAULT 'new',
    "lost_reason" TEXT,
    "event_type" TEXT,
    "event_start_date" DATE,
    "event_end_date" DATE,
    "venue" TEXT,
    "estimated_budget_amount" DECIMAL(12,2),
    "estimated_budget_currency" TEXT NOT NULL DEFAULT 'INR',
    "guest_count" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_stage_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "from_stage" "lead_stage",
    "to_stage" "lead_stage" NOT NULL,
    "reason" TEXT,
    "changed_by_id" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "follow_up_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "lead_id" UUID,
    "quotation_number" INTEGER NOT NULL,
    "revision_number" INTEGER NOT NULL DEFAULT 1,
    "status" "quotation_status" NOT NULL DEFAULT 'draft',
    "event_type" TEXT,
    "event_start_date" DATE,
    "event_end_date" DATE,
    "venue" TEXT,
    "valid_until" DATE,
    "terms" TEXT,
    "notes" TEXT,
    "subtotal_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "superseded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "lead_id" UUID,
    "quotation_id" UUID NOT NULL,
    "booking_number" INTEGER NOT NULL,
    "status" "event_status" NOT NULL DEFAULT 'approved',
    "event_type" TEXT,
    "event_start_date" DATE,
    "event_end_date" DATE,
    "venue_name" TEXT,
    "guest_count" INTEGER,
    "requirements_notes" TEXT,
    "preparation_status" "preparation_status" NOT NULL DEFAULT 'pending',
    "operational_milestone" TEXT,
    "execution_owner_id" UUID,
    "cancellation_reason" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "customers_tenant_id_status_idx" ON "customers"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_display_name_key" ON "customers"("tenant_id", "display_name");

-- CreateIndex
CREATE INDEX "leads_tenant_id_stage_idx" ON "leads"("tenant_id", "stage");

-- CreateIndex
CREATE INDEX "leads_tenant_id_assigned_to_id_idx" ON "leads"("tenant_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_source_idx" ON "leads"("tenant_id", "source");

-- CreateIndex
CREATE INDEX "leads_tenant_id_customer_id_idx" ON "leads"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "lead_stage_history_tenant_id_lead_id_idx" ON "lead_stage_history"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "lead_stage_history_lead_id_changed_at_idx" ON "lead_stage_history"("lead_id", "changed_at");

-- CreateIndex
CREATE INDEX "follow_ups_tenant_id_lead_id_idx" ON "follow_ups"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "follow_ups_tenant_id_status_due_at_idx" ON "follow_ups"("tenant_id", "status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_superseded_by_id_key" ON "quotations"("superseded_by_id");

-- CreateIndex
CREATE INDEX "quotations_tenant_id_status_idx" ON "quotations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "quotations_tenant_id_customer_id_idx" ON "quotations"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "quotations_tenant_id_lead_id_idx" ON "quotations"("tenant_id", "lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_tenant_id_quotation_number_revision_number_key" ON "quotations"("tenant_id", "quotation_number", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "events_lead_id_key" ON "events"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_quotation_id_key" ON "events"("quotation_id");

-- CreateIndex
CREATE INDEX "events_tenant_id_status_event_start_date_idx" ON "events"("tenant_id", "status", "event_start_date");

-- CreateIndex
CREATE INDEX "events_tenant_id_execution_owner_id_idx" ON "events"("tenant_id", "execution_owner_id");

-- CreateIndex
CREATE INDEX "events_tenant_id_customer_id_idx" ON "events"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_tenant_id_booking_number_key" ON "events"("tenant_id", "booking_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_execution_owner_id_fkey" FOREIGN KEY ("execution_owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
