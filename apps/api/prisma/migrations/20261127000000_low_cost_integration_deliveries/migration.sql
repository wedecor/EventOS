-- CreateTable
CREATE TABLE "integration_deliveries" (
    "delivery_id" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "enquiry_id" TEXT,
    "detail" TEXT,

    CONSTRAINT "integration_deliveries_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateIndex
CREATE INDEX "integration_deliveries_received_at_idx" ON "integration_deliveries"("received_at");
