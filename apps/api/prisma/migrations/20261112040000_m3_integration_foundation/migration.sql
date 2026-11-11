-- M3 integration foundation: stored documents, communication email fields, integration settings

CREATE TYPE "stored_document_category" AS ENUM (
  'quotation_pdf',
  'invoice_pdf',
  'customer_document',
  'event_image',
  'contract',
  'other'
);

CREATE TABLE "stored_documents" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "category" "stored_document_category" NOT NULL,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size_bytes" INTEGER NOT NULL,
  "storage_key" TEXT NOT NULL,
  "storage_provider" TEXT NOT NULL,
  "customer_id" UUID,
  "quotation_id" UUID,
  "booking_id" UUID,
  "invoice_id" UUID,
  "uploaded_by_user_id" UUID,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stored_documents_tenant_id_booking_id_deleted_at_idx" ON "stored_documents"("tenant_id", "booking_id", "deleted_at");
CREATE INDEX "stored_documents_tenant_id_customer_id_deleted_at_idx" ON "stored_documents"("tenant_id", "customer_id", "deleted_at");
CREATE INDEX "stored_documents_tenant_id_quotation_id_deleted_at_idx" ON "stored_documents"("tenant_id", "quotation_id", "deleted_at");
CREATE INDEX "stored_documents_tenant_id_invoice_id_deleted_at_idx" ON "stored_documents"("tenant_id", "invoice_id", "deleted_at");
CREATE INDEX "stored_documents_tenant_id_category_deleted_at_idx" ON "stored_documents"("tenant_id", "category", "deleted_at");

ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "communication_records" ADD COLUMN "quotation_id" UUID;
ALTER TABLE "communication_records" ADD COLUMN "invoice_id" UUID;
ALTER TABLE "communication_records" ADD COLUMN "recipient_address" TEXT;
ALTER TABLE "communication_records" ADD COLUMN "provider" TEXT;
ALTER TABLE "communication_records" ADD COLUMN "provider_message_id" TEXT;

CREATE INDEX "communication_records_tenant_id_quotation_id_occurred_at_idx" ON "communication_records"("tenant_id", "quotation_id", "occurred_at");
CREATE INDEX "communication_records_tenant_id_invoice_id_occurred_at_idx" ON "communication_records"("tenant_id", "invoice_id", "occurred_at");
CREATE INDEX "communication_records_tenant_id_provider_message_id_idx" ON "communication_records"("tenant_id", "provider_message_id");

ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "integration_settings" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "email_provider" TEXT NOT NULL DEFAULT 'test',
  "from_name" TEXT,
  "from_email" TEXT,
  "email_secret_configured" BOOLEAN NOT NULL DEFAULT false,
  "storage_provider" TEXT NOT NULL DEFAULT 'local',
  "storage_bucket" TEXT,
  "storage_endpoint" TEXT,
  "storage_secret_configured" BOOLEAN NOT NULL DEFAULT false,
  "last_email_test_at" TIMESTAMP(3),
  "last_email_test_status" TEXT,
  "last_storage_test_at" TIMESTAMP(3),
  "last_storage_test_status" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "integration_settings_tenant_id_key" ON "integration_settings"("tenant_id");
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
