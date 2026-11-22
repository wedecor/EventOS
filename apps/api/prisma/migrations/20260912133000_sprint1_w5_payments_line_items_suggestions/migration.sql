-- NO-OP on release/m0-m1-core-workflows lineage.
-- Kept so migration history from origin/main (Sprint 1 UAT) is preserved.
-- Equivalent schema was already introduced by earlier Phase 1 migrations
-- (payments/line items/suggestions, contacts, sessions) on this branch.
-- Do not delete this folder.
SELECT 1;
