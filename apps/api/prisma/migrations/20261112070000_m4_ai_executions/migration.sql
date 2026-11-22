-- M4-AI: metadata-only AI execution log (no prompt/response bodies).
CREATE TYPE "ai_execution_status" AS ENUM ('success', 'failure');

CREATE TABLE "ai_executions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lead_id" UUID,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "status" "ai_execution_status" NOT NULL,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "estimated_cost_usd" DECIMAL(12,6),
    "duration_ms" INTEGER,
    "correlation_id" TEXT,
    "failure_category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_executions_tenant_id_created_at_idx" ON "ai_executions"("tenant_id", "created_at");
CREATE INDEX "ai_executions_tenant_id_feature_created_at_idx" ON "ai_executions"("tenant_id", "feature", "created_at");
CREATE INDEX "ai_executions_tenant_id_lead_id_created_at_idx" ON "ai_executions"("tenant_id", "lead_id", "created_at");
CREATE INDEX "ai_executions_tenant_id_user_id_created_at_idx" ON "ai_executions"("tenant_id", "user_id", "created_at");

ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_executions" ADD CONSTRAINT "ai_executions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
