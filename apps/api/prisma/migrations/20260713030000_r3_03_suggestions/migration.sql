-- R3-03 — Suggestion queue (ADR-017)
-- CreateEnum
CREATE TYPE "suggestion_status" AS ENUM ('pending', 'accepted', 'dismissed', 'expired');

-- CreateTable
CREATE TABLE "suggestions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" "suggestion_status" NOT NULL DEFAULT 'pending',
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source_event_id" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" UUID,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suggestions_tenant_id_status_type_idx" ON "suggestions"("tenant_id", "status", "type");

-- CreateIndex
CREATE INDEX "suggestions_tenant_id_aggregate_type_aggregate_id_idx" ON "suggestions"("tenant_id", "aggregate_type", "aggregate_id");

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
