-- R3-07 — Customer IssueNote + ReviewRequest (EP1-CUS-004 / EP1-CUS-003)

-- CreateEnum
CREATE TYPE "issue_note_status" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "review_request_channel" AS ENUM ('google', 'instagram', 'other');

-- CreateEnum
CREATE TYPE "review_request_status" AS ENUM ('pending', 'sent', 'acknowledged', 'skipped');

-- CreateTable
CREATE TABLE "issue_notes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "issue_note_severity" NOT NULL DEFAULT 'medium',
    "notes" TEXT,
    "status" "issue_note_status" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "channel" "review_request_channel" NOT NULL,
    "channel_detail" TEXT,
    "status" "review_request_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_notes_tenant_id_event_id_created_at_idx" ON "issue_notes"("tenant_id", "event_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "review_requests_event_id_key" ON "review_requests"("event_id");

-- CreateIndex
CREATE INDEX "review_requests_tenant_id_customer_id_idx" ON "review_requests"("tenant_id", "customer_id");

-- AddForeignKey
ALTER TABLE "issue_notes" ADD CONSTRAINT "issue_notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_notes" ADD CONSTRAINT "issue_notes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_notes" ADD CONSTRAINT "issue_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
