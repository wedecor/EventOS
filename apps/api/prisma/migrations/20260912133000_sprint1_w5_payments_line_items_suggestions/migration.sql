-- CreateEnum
CREATE TYPE "payment_type" AS ENUM ('advance', 'balance', 'other');
CREATE TYPE "payment_method" AS ENUM ('upi', 'cash', 'bank_transfer', 'card', 'cheque', 'other');
CREATE TYPE "payment_status" AS ENUM ('recorded', 'void');
CREATE TYPE "suggestion_status" AS ENUM ('pending', 'accepted', 'dismissed', 'expired');

-- CreateTable
CREATE TABLE "quotation_line_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "package_id" UUID,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quotation_line_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID,
    "lead_id" UUID,
    "quotation_id" UUID,
    "payment_type" "payment_type" NOT NULL DEFAULT 'advance',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "method" "payment_method" NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'recorded',
    "received_at" TIMESTAMP(3) NOT NULL,
    "missing_proof_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "suggestions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" "suggestion_status" NOT NULL DEFAULT 'pending',
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_line_items_tenant_id_quotation_id_idx" ON "quotation_line_items"("tenant_id", "quotation_id");
CREATE INDEX "payments_tenant_id_event_id_idx" ON "payments"("tenant_id", "event_id");
CREATE INDEX "payments_tenant_id_lead_id_idx" ON "payments"("tenant_id", "lead_id");
CREATE INDEX "payments_tenant_id_quotation_id_idx" ON "payments"("tenant_id", "quotation_id");
CREATE INDEX "payments_tenant_id_status_payment_type_idx" ON "payments"("tenant_id", "status", "payment_type");
CREATE INDEX "suggestions_tenant_id_status_idx" ON "suggestions"("tenant_id", "status");
CREATE INDEX "suggestions_tenant_id_aggregate_type_aggregate_id_idx" ON "suggestions"("tenant_id", "aggregate_type", "aggregate_id");

-- AddForeignKey
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
