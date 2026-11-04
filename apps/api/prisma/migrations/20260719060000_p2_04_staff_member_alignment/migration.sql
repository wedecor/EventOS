-- P2-04 — StaffMember operational identity + expand-contract assignment FK alignment.
-- Phase 1 (expand): new StaffMember fields + legacy_user_id; backfill; repoint staff_member_id → staff_members.
-- Phase 3 (later): drop legacy_user_id after validation.

CREATE TYPE "staff_employment_type" AS ENUM ('permanent', 'temporary');

ALTER TABLE "staff_members"
  ADD COLUMN "user_id" UUID,
  ADD COLUMN "employment_type" "staff_employment_type" NOT NULL DEFAULT 'temporary',
  ADD COLUMN "joined_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "staff_members_user_id_key" ON "staff_members"("user_id");
CREATE INDEX "staff_members_tenant_id_employment_type_idx" ON "staff_members"("tenant_id", "employment_type");

ALTER TABLE "staff_members"
  ADD CONSTRAINT "staff_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Expand: preserve legacy User identity on assignments
ALTER TABLE "staff_assignments"
  ADD COLUMN "legacy_user_id" UUID;

UPDATE "staff_assignments"
SET "legacy_user_id" = "staff_member_id"
WHERE "legacy_user_id" IS NULL;

CREATE INDEX "staff_assignments_tenant_id_legacy_user_id_idx"
  ON "staff_assignments"("tenant_id", "legacy_user_id");

-- Drop User FK on staff_member_id so we can repoint values to StaffMember ids
ALTER TABLE "staff_assignments"
  DROP CONSTRAINT "staff_assignments_staff_member_id_fkey";

-- Backfill StaffMember rows for Users that appear on assignments but have no linked StaffMember
INSERT INTO "staff_members" (
  "id",
  "tenant_id",
  "user_id",
  "name",
  "role",
  "department",
  "phone",
  "email",
  "employment_type",
  "status",
  "joined_at",
  "created_at",
  "updated_at",
  "version"
)
SELECT
  gen_random_uuid(),
  u."tenant_id",
  u."id",
  u."name",
  COALESCE(NULLIF(u."role", ''), 'decorator'),
  NULL,
  COALESCE(u."email", 'unknown'),
  u."email",
  'temporary'::"staff_employment_type",
  'active'::"staff_member_status",
  u."created_at",
  NOW(),
  NOW(),
  1
FROM "users" u
WHERE EXISTS (
  SELECT 1
  FROM "staff_assignments" sa
  WHERE sa."legacy_user_id" = u."id"
)
AND NOT EXISTS (
  SELECT 1
  FROM "staff_members" sm
  WHERE sm."user_id" = u."id"
);

-- Repoint assignment staff_member_id to StaffMember (prefer user-linked master)
UPDATE "staff_assignments" sa
SET "staff_member_id" = sm."id"
FROM "staff_members" sm
WHERE sa."legacy_user_id" = sm."user_id"
  AND sm."user_id" IS NOT NULL;

-- Safety: any remaining rows still pointing at a User id without a StaffMember
-- (should not happen after insert) — leave as-is would fail new FK; assert none.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "staff_assignments" sa
    WHERE NOT EXISTS (
      SELECT 1 FROM "staff_members" sm WHERE sm."id" = sa."staff_member_id"
    )
  ) THEN
    RAISE EXCEPTION 'P2-04 backfill incomplete: staff_assignments still reference non-StaffMember ids';
  END IF;
END $$;

ALTER TABLE "staff_assignments"
  ADD CONSTRAINT "staff_assignments_staff_member_id_fkey"
  FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "staff_assignments"
  ADD CONSTRAINT "staff_assignments_legacy_user_id_fkey"
  FOREIGN KEY ("legacy_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
