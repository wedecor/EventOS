-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('confirmed', 'void');

-- CreateEnum
CREATE TYPE "workspace_status" AS ENUM ('inactive', 'active', 'archived');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "staff_assignment_status" AS ENUM ('proposed', 'confirmed', 'released', 'cancelled');

-- CreateEnum
CREATE TYPE "inventory_movement_status" AS ENUM ('planned', 'picked', 'packed', 'loaded', 'at_venue', 'returned', 'cleaned_ready');

-- CreateEnum
CREATE TYPE "vendor_status" AS ENUM ('preferred', 'active', 'backup', 'paused', 'blocked');

-- CreateEnum
CREATE TYPE "procurement_line_status" AS ENUM ('planned', 'requested', 'confirmed', 'delivered', 'completed');

-- CreateEnum
CREATE TYPE "cost_variance_reason" AS ENUM ('market_price_increase', 'vendor_price_change', 'vendor_change_availability_quality', 'customer_scope_change', 'emergency_purchase', 'material_wastage_damage', 'incorrect_estimation', 'other');

-- CreateEnum
CREATE TYPE "issue_note_severity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "vendor_expense_status" AS ENUM ('confirmed', 'void');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'void');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "workspace_status" "workspace_status" NOT NULL DEFAULT 'inactive';

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID,
    "lead_id" UUID,
    "quotation_id" UUID,
    "invoice_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'confirmed',
    "received_at" TIMESTAMP(3) NOT NULL,
    "attachment_id" UUID,
    "missing_proof_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_line_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quotation_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_to" UUID,
    "due_at" TIMESTAMP(3),
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "role" TEXT,
    "is_on_site_lead" BOOLEAN NOT NULL DEFAULT false,
    "reporting_at" TIMESTAMP(3),
    "note" TEXT,
    "status" "staff_assignment_status" NOT NULL DEFAULT 'proposed',
    "confirmed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "inventory_movement_status" NOT NULL DEFAULT 'planned',
    "picked_at" TIMESTAMP(3),
    "packed_at" TIMESTAMP(3),
    "loaded_at" TIMESTAMP(3),
    "at_venue_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "cleaned_ready_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movement_damage_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "movement_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "accountability" TEXT,
    "occurred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movement_damage_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "vendor_status" NOT NULL DEFAULT 'active',
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "location" TEXT,
    "services_provided" TEXT,
    "pricing_notes" TEXT,
    "payment_terms" TEXT,
    "tax_details" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_issue_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "issue_note_severity" NOT NULL DEFAULT 'medium',
    "occurred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_issue_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_procurements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "status" "procurement_line_status" NOT NULL DEFAULT 'planned',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vendor_procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vendor_procurement_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "quotation_line_item_id" UUID,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "budgeted_amount" DECIMAL(12,2),
    "actual_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "procurement_line_status" NOT NULL DEFAULT 'planned',
    "requested_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cost_variance_amount" DECIMAL(12,2),
    "cost_variance_reason" "cost_variance_reason",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "procurement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_line_issue_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "procurement_line_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "issue_note_severity" NOT NULL DEFAULT 'medium',
    "occurred_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procurement_line_issue_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_expenses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "vendor_id" UUID NOT NULL,
    "procurement_line_id" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "payment_method" NOT NULL,
    "status" "vendor_expense_status" NOT NULL DEFAULT 'confirmed',
    "paid_at" TIMESTAMP(3) NOT NULL,
    "attachment_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "vendor_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "invoice_number" INTEGER NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "subtotal_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payments_tenant_id_booking_id_idx" ON "payments"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_lead_id_idx" ON "payments"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_quotation_id_idx" ON "payments"("tenant_id", "quotation_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_invoice_id_idx" ON "payments"("tenant_id", "invoice_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "quotation_line_items_tenant_id_quotation_id_idx" ON "quotation_line_items"("tenant_id", "quotation_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_booking_id_idx" ON "tasks"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_status_idx" ON "tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_assigned_to_idx" ON "tasks"("tenant_id", "assigned_to");

-- CreateIndex
CREATE INDEX "checklist_items_tenant_id_task_id_idx" ON "checklist_items"("tenant_id", "task_id");

-- CreateIndex
CREATE INDEX "staff_assignments_tenant_id_booking_id_idx" ON "staff_assignments"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "staff_assignments_tenant_id_staff_member_id_idx" ON "staff_assignments"("tenant_id", "staff_member_id");

-- CreateIndex
CREATE INDEX "staff_assignments_tenant_id_status_idx" ON "staff_assignments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_booking_id_status_idx" ON "inventory_movements"("tenant_id", "booking_id", "status");

-- CreateIndex
CREATE INDEX "inventory_movements_tenant_id_inventory_item_id_status_idx" ON "inventory_movements"("tenant_id", "inventory_item_id", "status");

-- CreateIndex
CREATE INDEX "inventory_movement_damage_notes_tenant_id_movement_id_idx" ON "inventory_movement_damage_notes"("tenant_id", "movement_id");

-- CreateIndex
CREATE INDEX "vendors_tenant_id_status_idx" ON "vendors"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "vendors_tenant_id_category_idx" ON "vendors"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "vendor_issue_notes_tenant_id_vendor_id_idx" ON "vendor_issue_notes"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "vendor_procurements_tenant_id_booking_id_idx" ON "vendor_procurements"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "vendor_procurements_tenant_id_vendor_id_idx" ON "vendor_procurements"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "procurement_lines_tenant_id_vendor_procurement_id_idx" ON "procurement_lines"("tenant_id", "vendor_procurement_id");

-- CreateIndex
CREATE INDEX "procurement_lines_tenant_id_booking_id_status_idx" ON "procurement_lines"("tenant_id", "booking_id", "status");

-- CreateIndex
CREATE INDEX "procurement_line_issue_notes_tenant_id_procurement_line_id_idx" ON "procurement_line_issue_notes"("tenant_id", "procurement_line_id");

-- CreateIndex
CREATE INDEX "vendor_expenses_tenant_id_booking_id_idx" ON "vendor_expenses"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "vendor_expenses_tenant_id_vendor_id_idx" ON "vendor_expenses"("tenant_id", "vendor_id");

-- CreateIndex
CREATE INDEX "vendor_expenses_tenant_id_status_idx" ON "vendor_expenses"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_booking_id_idx" ON "invoices"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_customer_id_idx" ON "invoices"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_invoice_number_key" ON "invoices"("tenant_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_line_items_tenant_id_invoice_id_idx" ON "invoice_line_items"("tenant_id", "invoice_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movement_damage_notes" ADD CONSTRAINT "inventory_movement_damage_notes_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "inventory_movements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_issue_notes" ADD CONSTRAINT "vendor_issue_notes_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_procurements" ADD CONSTRAINT "vendor_procurements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_procurements" ADD CONSTRAINT "vendor_procurements_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_procurements" ADD CONSTRAINT "vendor_procurements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_lines" ADD CONSTRAINT "procurement_lines_vendor_procurement_id_fkey" FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_lines" ADD CONSTRAINT "procurement_lines_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_lines" ADD CONSTRAINT "procurement_lines_quotation_line_item_id_fkey" FOREIGN KEY ("quotation_line_item_id") REFERENCES "quotation_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_line_issue_notes" ADD CONSTRAINT "procurement_line_issue_notes_procurement_line_id_fkey" FOREIGN KEY ("procurement_line_id") REFERENCES "procurement_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_expenses" ADD CONSTRAINT "vendor_expenses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_expenses" ADD CONSTRAINT "vendor_expenses_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_expenses" ADD CONSTRAINT "vendor_expenses_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_expenses" ADD CONSTRAINT "vendor_expenses_procurement_line_id_fkey" FOREIGN KEY ("procurement_line_id") REFERENCES "procurement_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
