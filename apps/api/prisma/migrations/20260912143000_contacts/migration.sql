-- NO-OP on release/m0-m1-core-workflows lineage.
-- Kept so migration history from origin/main (Sprint 1 UAT) is preserved.
-- Equivalent schema was already introduced by earlier Phase 1 migrations
-- (payments/line items/suggestions, contacts, sessions) on this branch.
-- Do not delete this folder.
--
-- Databases that applied the original Sprint 1 UAT versions of migrations
-- 20260912133000, 20260912143000, 20260912150000 must be reset; fresh
-- databases are unaffected.
SELECT 1;
