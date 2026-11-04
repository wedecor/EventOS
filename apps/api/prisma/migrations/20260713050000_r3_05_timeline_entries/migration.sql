-- R3-05 — TimelineEntry / client_interactions (EP1-CUS-002)
-- CreateEnum
CREATE TYPE "timeline_entry_type" AS ENUM ('note', 'issue', 'other');

-- CreateTable
CREATE TABLE "client_interactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "type" "timeline_entry_type" NOT NULL,
    "message" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "recorded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_interactions_tenant_id_event_id_created_at_idx" ON "client_interactions"("tenant_id", "event_id", "created_at");

-- CreateIndex
CREATE INDEX "client_interactions_tenant_id_customer_id_occurred_at_idx" ON "client_interactions"("tenant_id", "customer_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_interactions" ADD CONSTRAINT "client_interactions_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
