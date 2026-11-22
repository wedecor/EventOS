-- M4-AI remediation: optional lead association on communication records.
-- Existing rows remain NULL (compatible with pre-association history).
ALTER TABLE "communication_records" ADD COLUMN "lead_id" UUID;

ALTER TABLE "communication_records"
  ADD CONSTRAINT "communication_records_lead_id_fkey"
  FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "communication_records_tenant_id_lead_id_occurred_at_idx"
  ON "communication_records"("tenant_id", "lead_id", "occurred_at");
