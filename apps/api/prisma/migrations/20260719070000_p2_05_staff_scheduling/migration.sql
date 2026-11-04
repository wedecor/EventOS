-- P2-05 — Staff availability & leave (owned by StaffMember)

CREATE TYPE "staff_availability_kind" AS ENUM ('available', 'unavailable', 'partial_day', 'holiday');
CREATE TYPE "staff_leave_type" AS ENUM ('casual', 'sick', 'vacation', 'emergency', 'other');
CREATE TYPE "staff_leave_status" AS ENUM ('requested', 'approved', 'rejected', 'cancelled');

CREATE TABLE "staff_availability" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "date" DATE,
    "weekday" INTEGER,
    "start_time" TEXT,
    "end_time" TEXT,
    "kind" "staff_availability_kind" NOT NULL DEFAULT 'available',
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "staff_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "staff_leave" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "leave_type" "staff_leave_type" NOT NULL,
    "status" "staff_leave_status" NOT NULL DEFAULT 'requested',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "reviewed_by_user_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "staff_leave_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "staff_availability_tenant_id_staff_member_id_date_idx" ON "staff_availability"("tenant_id", "staff_member_id", "date");
CREATE INDEX "staff_availability_tenant_id_staff_member_id_weekday_idx" ON "staff_availability"("tenant_id", "staff_member_id", "weekday");
CREATE INDEX "staff_leave_tenant_id_staff_member_id_status_idx" ON "staff_leave"("tenant_id", "staff_member_id", "status");
CREATE INDEX "staff_leave_tenant_id_start_date_end_date_idx" ON "staff_leave"("tenant_id", "start_date", "end_date");

ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "staff_leave" ADD CONSTRAINT "staff_leave_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
