# M3 — Implementation Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Branch** | `release/m0-m1-core-workflows` |
| **Baseline parent** | M2 `d8ed43c` preserved; tip `6a0dc10` (M2 report) |
| **Commits** | **None** (not authorized) |
| **Push / merge / rebase** | **Not performed** |
| **Working tree** | M3 changes remain **uncommitted** by design |

---

## Validation summary (completion gate)

| Item | Status |
|------|--------|
| Migration application (isolated `eventos_e2e` @ `:55432` only) | **Applied** — `prisma migrate status` → up to date; production `eventos` @ `:5432` **not** migrated (`stored_documents` / `integration_settings` absent) |
| IntegrationSettings CRUD | **Complete** — GET/PATCH + write-only secrets + masking |
| Connection tests | **Complete** — `POST …/test-email`, `POST …/test-storage` (adapter/local probe) |
| SMTP live verification | **Not verified** (adapter present; no live SMTP credentials exercised) |
| S3 live verification | **Not verified** (adapter present; no live S3 credentials exercised) |
| Playwright M2 | **Pass** (`core-workflow.spec.ts`) |
| Playwright M3 | **Pass** (`m3-integration-workflow.spec.ts`, DB assertions included) |
| API unit tests | **722 passed** (baseline session start: 716) |
| Web unit tests | **121 passed** |
| API build | **Pass** |
| Web typecheck | **Pass** |
| Web build | **Pass** |

M3 workflows are **complete for test-adapter / local-storage validation**. They are **not** complete for live SMTP or live S3 until operator credentials are verified separately.

---

## 1. Features completed

| Capability | Status |
|------------|--------|
| Quotation PDF generation + download API/UI | **Done** |
| Invoice PDF generation + download API/UI | **Done** |
| StoredDocument model + migrations | **Done** (applied to e2e DB only) |
| Local storage adapter + S3 adapter | **Done** (S3 live round-trip not verified) |
| Upload / list / download / delete APIs + booking UI | **Done** |
| Quotation / invoice email via TestMailAdapter + SMTP adapter | **Done** (SMTP live send not verified) |
| CommunicationRecord extensions + history on email | **Done** |
| Quotation/invoice communications list endpoints | **Done** |
| Duplicate-send window guard | **Done** (in-process) |
| IntegrationSettings admin CRUD + masked secrets | **Done** |
| Connection-test actions (email + storage) | **Done** (test/local; does not claim “connected” on save) |
| Audit logging for settings update / connection tests / email / documents | **Done** |
| Playwright M3 isolated workflow + DB verify | **Done** |

---

## 2. Features deferred

- WhatsApp / SMS / Razorpay / AI / multi-tenant (out of scope).
- BullMQ workers (sync send retained).
- Delivery webhooks (not implemented).
- Live SMTP / live S3 operator smoke with real credentials.
- Redis-backed duplicate-send idempotency (process-local map today).
- Auto-persist generated PDFs as StoredDocument rows.
- OpenAPI export regeneration / generated web types sync.

---

## 3. Architecture changes

- `shared/pdf` — PDFKit builders.
- `shared/storage` — StoragePort + local/S3 + upload validation + path safety.
- `shared/mail` — MailPort + test/SMTP/none.
- `shared/crypto/secret-box` — AES-256-GCM write-only secrets (key material from `JWT_SECRET`).
- `modules/documents` — StoredDocument CRUD.
- `modules/integrations` — IntegrationSettings service/controller.
- `OutboundEmailApplicationService` — PDF attach + CommunicationRecord write.
- Global StorageModule + MailModule; IntegrationsModule registered in AppModule.

---

## 4. Prisma models and migrations

1. `20261112040000_m3_integration_foundation` — `stored_documents`, `integration_settings` (base), communication email columns + FKs/indexes.
2. `20261112043000_m3_integration_secrets` — encrypted secret columns + smtp/storage access fields.

**Rollback implications:** dropping tables loses document metadata and settings; communication columns are nullable additive. Apply only after backup on shared environments.

**Compatibility:** additive; safe for existing rows. Verified on empty/populated e2e DB after prior M2 seed/workflow data.

---

## 5. API endpoints added/changed

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/quotations/:id/pdf` | `quotations:read` |
| POST | `/api/v1/quotations/:id/email` | `quotations:send`; not approve |
| GET | `/api/v1/quotations/:id/communications` | `communications:read` |
| GET | `/api/v1/invoices/:id/pdf` | `invoices:read` |
| POST | `/api/v1/invoices/:id/email` | `invoices:send`; not mark paid |
| GET | `/api/v1/invoices/:id/communications` | `communications:read` |
| POST/GET/DELETE | `/api/v1/documents` (+ download) | `documents:write` / `documents:read` |
| GET/PATCH | `/api/v1/integrations/settings` | `settings:read` / `settings:write`; secrets never returned |
| POST | `/api/v1/integrations/settings/test-email` | `settings:write` |
| POST | `/api/v1/integrations/settings/test-storage` | `settings:write` |

Existing `POST …/send` routes remain **status-only**.

---

## 6. Frontend screens / workflows

- Quotation detail: Download PDF, Email PDF, Mark sent.
- Invoice panel: PDF, Email, Mark sent, Void (customerId hydrated when booking loads).
- Booking finance: Event documents upload/list/download/delete.
- Settings → Integrations: full form, secret masking, connection tests.

---

## 7. External provider integrations

| Provider | Implementation | Live verified? |
|----------|----------------|----------------|
| PDFKit | In-process | Yes (unit + Playwright download) |
| Local filesystem storage | Default | Yes (unit + Playwright upload/download + connection test) |
| S3-compatible | Adapter present | **No** |
| Test mail adapter | Default `MAIL_PROVIDER=test` | Yes (unit + Playwright email + connection test) |
| SMTP (nodemailer) | Adapter present | **No** |

---

## 8. Security review (Phase 4)

| Topic | Finding |
|-------|---------|
| Document ownership / authz | Tenant-scoped repository queries; linked entities validated before upload |
| Upload MIME / size | Allow-list MIME + extension; size capped (service default 10MB; multer hard limit 15MB) |
| Storage path safety | Server-generated keys; local adapter rejects `..` / absolute / null bytes |
| Download authorization | `documents:read` + tenant `findById` |
| Email duplicate-send | In-process window (`MAIL_IDEMPOTENCY_WINDOW_SEC`, default 30s) |
| Webhooks | **Not implemented** |
| Secret exposure | DTO omits ciphertext/plaintext; failure messages sanitized; audit metadata flags only |
| Integration settings authz | `settings:read` / `settings:write` (admin roles include these; not anonymous) |
| Audit logging | Settings update, connection tests, document upload/delete, quotation/invoice email |

No critical confirmed issues remaining after review; invoice create form race (empty customerId) fixed by syncing `customerId` when booking query resolves.

---

## 9. Tests added / extended

- PDF builders, document upload validation, secret-box, IntegrationSettings service, TestMailAdapter.
- Playwright: `e2e/m3-integration-workflow.spec.ts` + DB helpers.
- M2 Playwright updated for **Mark sent** label (status send ≠ Email PDF).

---

## 10–12. Final regression (Phase 5)

| Gate | Baseline (task start) | Final |
|------|----------------------|-------|
| API Jest | 716 | **722 passed** |
| Web Vitest | 121 | **121 passed** |
| API build | pass | **pass** |
| Web typecheck | pass | **pass** |
| Web build | pass | **pass** |
| Playwright M2 | prior pass | **pass** (after Mark sent locator update) |
| Playwright M3 | n/a | **pass** |

Transient failures during this session were environmental (API/web down during rebuild; duplicate-send window; Zod UUID seed tenant id; empty invoice customerId) and were fixed before final green.

---

## 13. Environment variables

`STORAGE_*`, `MAIL_*`, `SMTP_*`. Defaults: `STORAGE_PROVIDER=local`, `MAIL_PROVIDER=test`. Secret encryption uses `JWT_SECRET` (≥32 chars).

---

## 14. Remaining deployment requirements

1. Apply both M3 migrations to the **target non-prod/prod** DB only after explicit operator approval (not done here for production).
2. Set mail/storage env for the target environment.
3. Ensure local storage root is writable **or** configure S3 and run live connection test.
4. Deploy API + static web.
5. Smoke with test adapter first; then optional live SMTP/S3 verification.
6. Authorize git commit when review complete (currently uncommitted).

---

## 15. Known limitations

- Duplicate-send guard is process-local.
- Provider “ok” means acceptance/probe success — **not** mailbox delivery or production S3 proof.
- Saving IntegrationSettings never sets connected status; only connection-test fields do.
- OpenAPI artifact not regenerated in this pass.

---

*End of M3 implementation report.*
