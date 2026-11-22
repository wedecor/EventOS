-- R3-01 — Staff Master (EP1-STF-001)
-- CreateEnum
CREATE TYPE "staff_member_status" AS ENUM ('active', 'inactive', 'on_leave');

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "staff_member_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_members_tenant_id_status_idx" ON "staff_members"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
