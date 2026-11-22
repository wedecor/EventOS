-- P2-09 Communication Center (metadata only; no provider integrations)

CREATE TYPE "communication_channel" AS ENUM (
  'whatsapp', 'email', 'sms', 'phone_call', 'internal_note', 'manual_meeting'
);
CREATE TYPE "communication_direction" AS ENUM ('incoming', 'outgoing');
CREATE TYPE "communication_status" AS ENUM (
  'draft', 'queued', 'sent', 'delivered', 'read', 'failed', 'cancelled', 'completed'
);
CREATE TYPE "communication_template_status" AS ENUM ('active', 'archived');
CREATE TYPE "reminder_status" AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE "reminder_category" AS ENUM (
  'payment_follow_up', 'event_reminder', 'vendor_follow_up',
  'customer_follow_up', 'staff_follow_up', 'other'
);

CREATE TABLE "communication_templates" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "channel" "communication_channel",
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "status" "communication_template_status" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_records" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID,
  "customer_id" UUID,
  "vendor_id" UUID,
  "staff_member_id" UUID,
  "template_id" UUID,
  "channel" "communication_channel" NOT NULL,
  "direction" "communication_direction" NOT NULL,
  "status" "communication_status" NOT NULL DEFAULT 'draft',
  "subject" TEXT,
  "body" TEXT,
  "failure_reason" TEXT,
  "created_by_user_id" UUID,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "read_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "communication_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_attachments" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "communication_record_id" UUID NOT NULL,
  "file_name" TEXT,
  "mime_type" TEXT,
  "file_size_bytes" INTEGER,
  "storage_key" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "communication_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reminders" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "booking_id" UUID,
  "customer_id" UUID,
  "vendor_id" UUID,
  "staff_member_id" UUID,
  "communication_record_id" UUID,
  "category" "reminder_category" NOT NULL DEFAULT 'other',
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "due_at" TIMESTAMP(3) NOT NULL,
  "status" "reminder_status" NOT NULL DEFAULT 'pending',
  "assigned_to_user_id" UUID,
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "customer_id" UUID,
  "user_id" UUID,
  "whatsapp" BOOLEAN NOT NULL DEFAULT true,
  "email" BOOLEAN NOT NULL DEFAULT true,
  "sms" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communication_templates_tenant_id_status_idx" ON "communication_templates"("tenant_id", "status");
CREATE INDEX "communication_templates_tenant_id_category_idx" ON "communication_templates"("tenant_id", "category");
CREATE INDEX "communication_records_tenant_id_booking_id_occurred_at_idx" ON "communication_records"("tenant_id", "booking_id", "occurred_at");
CREATE INDEX "communication_records_tenant_id_customer_id_occurred_at_idx" ON "communication_records"("tenant_id", "customer_id", "occurred_at");
CREATE INDEX "communication_records_tenant_id_status_deleted_at_idx" ON "communication_records"("tenant_id", "status", "deleted_at");
CREATE INDEX "communication_records_tenant_id_channel_idx" ON "communication_records"("tenant_id", "channel");
CREATE INDEX "communication_attachments_tenant_id_communication_record_id_deleted_at_idx" ON "communication_attachments"("tenant_id", "communication_record_id", "deleted_at");
CREATE INDEX "reminders_tenant_id_status_due_at_idx" ON "reminders"("tenant_id", "status", "due_at");
CREATE INDEX "reminders_tenant_id_booking_id_due_at_idx" ON "reminders"("tenant_id", "booking_id", "due_at");
CREATE INDEX "reminders_tenant_id_assigned_to_user_id_status_idx" ON "reminders"("tenant_id", "assigned_to_user_id", "status");
CREATE INDEX "notification_preferences_tenant_id_customer_id_idx" ON "notification_preferences"("tenant_id", "customer_id");
CREATE INDEX "notification_preferences_tenant_id_user_id_idx" ON "notification_preferences"("tenant_id", "user_id");

ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_records" ADD CONSTRAINT "communication_records_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "communication_attachments" ADD CONSTRAINT "communication_attachments_communication_record_id_fkey" FOREIGN KEY ("communication_record_id") REFERENCES "communication_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reminders" ADD CONSTRAINT "reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_communication_record_id_fkey" FOREIGN KEY ("communication_record_id") REFERENCES "communication_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
