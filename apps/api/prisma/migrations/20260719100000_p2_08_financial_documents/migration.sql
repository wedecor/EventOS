-- P2-08 — Financial documents & attachment metadata (no binary storage)

CREATE TYPE "financial_document_type" AS ENUM (
  'payment_proof',
  'expense_receipt',
  'vendor_invoice',
  'customer_invoice',
  'credit_note',
  'debit_note',
  'other'
);

CREATE TYPE "financial_document_verification_status" AS ENUM (
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE "financial_document_audit_event_type" AS ENUM (
  'uploaded',
  'updated',
  'verified',
  'rejected',
  'deleted'
);

CREATE TABLE "financial_documents" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID NOT NULL,
  "document_type" "financial_document_type" NOT NULL,
  "verification_status" "financial_document_verification_status" NOT NULL DEFAULT 'pending',
  "description" TEXT,
  "file_name" TEXT,
  "mime_type" TEXT,
  "file_size_bytes" INTEGER,
  "storage_key" TEXT,
  "payment_id" UUID,
  "vendor_expense_id" UUID,
  "vendor_procurement_id" UUID,
  "invoice_id" UUID,
  "uploaded_by_user_id" UUID,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verified_by_user_id" UUID,
  "verified_at" TIMESTAMP(3),
  "verification_notes" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "financial_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financial_document_audit_events" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "financial_document_id" UUID NOT NULL,
  "event_type" "financial_document_audit_event_type" NOT NULL,
  "message" TEXT NOT NULL,
  "actor_user_id" UUID,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "financial_document_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "financial_documents_tenant_id_booking_id_deleted_at_idx"
  ON "financial_documents"("tenant_id", "booking_id", "deleted_at");
CREATE INDEX "financial_documents_tenant_id_payment_id_idx"
  ON "financial_documents"("tenant_id", "payment_id");
CREATE INDEX "financial_documents_tenant_id_vendor_expense_id_idx"
  ON "financial_documents"("tenant_id", "vendor_expense_id");
CREATE INDEX "financial_documents_tenant_id_vendor_procurement_id_idx"
  ON "financial_documents"("tenant_id", "vendor_procurement_id");
CREATE INDEX "financial_documents_tenant_id_verification_status_idx"
  ON "financial_documents"("tenant_id", "verification_status");
CREATE INDEX "financial_document_audit_events_tenant_id_financial_document_id_occurred_at_idx"
  ON "financial_document_audit_events"("tenant_id", "financial_document_id", "occurred_at");

ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_booking_id_fkey"
  FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_vendor_expense_id_fkey"
  FOREIGN KEY ("vendor_expense_id") REFERENCES "vendor_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_vendor_procurement_id_fkey"
  FOREIGN KEY ("vendor_procurement_id") REFERENCES "vendor_procurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_uploaded_by_user_id_fkey"
  FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "financial_documents"
  ADD CONSTRAINT "financial_documents_verified_by_user_id_fkey"
  FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "financial_document_audit_events"
  ADD CONSTRAINT "financial_document_audit_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "financial_document_audit_events"
  ADD CONSTRAINT "financial_document_audit_events_financial_document_id_fkey"
  FOREIGN KEY ("financial_document_id") REFERENCES "financial_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
