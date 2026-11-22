-- DropIndex
DROP INDEX "customers_tenant_id_display_name_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "disabled_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "external_managed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_normalized" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "external_ref" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'eventos',
ALTER COLUMN "quotation_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "event_functions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "external_function_id" TEXT,
    "event_type" TEXT NOT NULL,
    "event_type_label" TEXT,
    "date" DATE NOT NULL,
    "time" TEXT,
    "venue_name" TEXT,
    "venue_area" TEXT,
    "venue_address" TEXT,
    "place_id" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "notes" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "event_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_identities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linked_by_user_id" UUID NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_record_links" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "last_source_updated_at" TIMESTAMP(3) NOT NULL,
    "last_payload" JSONB NOT NULL,
    "last_delivery_id" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_record_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_functions_tenant_id_booking_id_idx" ON "event_functions"("tenant_id", "booking_id");

-- CreateIndex
CREATE INDEX "event_functions_tenant_id_date_idx" ON "event_functions"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "external_identities_tenant_id_user_id_idx" ON "external_identities"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_provider_subject_key" ON "external_identities"("provider", "subject");

-- CreateIndex
CREATE INDEX "external_record_links_tenant_id_entity_type_entity_id_idx" ON "external_record_links"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_record_links_tenant_id_source_external_id_key" ON "external_record_links"("tenant_id", "source", "external_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_display_name_idx" ON "customers"("tenant_id", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "customers_tenant_id_phone_normalized_key" ON "customers"("tenant_id", "phone_normalized");

-- AddForeignKey
ALTER TABLE "event_functions" ADD CONSTRAINT "event_functions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_functions" ADD CONSTRAINT "event_functions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_linked_by_user_id_fkey" FOREIGN KEY ("linked_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_record_links" ADD CONSTRAINT "external_record_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
