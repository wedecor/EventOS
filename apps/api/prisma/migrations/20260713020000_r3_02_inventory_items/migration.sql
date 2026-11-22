-- R3-02 — Inventory Item Master (EP1-INV-001, EP1-INV-002)
-- CreateEnum
CREATE TYPE "inventory_item_taxonomy" AS ENUM ('reusable', 'consumable', 'per_event');

-- CreateEnum
CREATE TYPE "inventory_item_condition" AS ENUM ('good', 'fair', 'damaged', 'retired');

-- CreateEnum
CREATE TYPE "inventory_item_status" AS ENUM ('active', 'inactive', 'retired');

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL,
    "taxonomy" "inventory_item_taxonomy" NOT NULL,
    "unit" TEXT NOT NULL,
    "condition" "inventory_item_condition" NOT NULL DEFAULT 'good',
    "quantity_at_jp_nagar" INTEGER NOT NULL DEFAULT 0,
    "status" "inventory_item_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_status_idx" ON "inventory_items"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_taxonomy_idx" ON "inventory_items"("tenant_id", "taxonomy");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_category_idx" ON "inventory_items"("tenant_id", "category");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
