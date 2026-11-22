# M3 — Implementation Plan

| Field | Value |
|-------|-------|
| **Branch** | `release/m0-m1-core-workflows` |
| **Baseline parent** | `d8ed43c` (M2) / tip `6a0dc10` |
| **Authority** | `M3_RECONNAISSANCE.md` + existing Nest/Prisma conventions |
| **Commits** | Only when explicitly authorized |

---

## Goals (definition of done)

1. Quotation PDF download (branded, correct totals).
2. Invoice PDF download (branded, paid/outstanding when available).
3. Upload / list / download / delete authorized ops documents.
4. Email quotation + invoice via configured provider (test adapter in CI).
5. Communication history records send + status (no secret leakage).
6. Integration settings (masked secrets, audit).
7. Admin Portal workflows + tests + docs; M0–M2 regressions green.

---

## Architecture (modular monolith)

```
shared/pdf/          PdfDocumentService (PDFKit)
shared/storage/      StoragePort → LocalStorageAdapter | S3StorageAdapter
shared/mail/         MailPort → TestMailAdapter | SmtpMailAdapter
modules/documents/   StoredDocument CRUD + download stream
modules/communication/  extend for outbound email + provider ids
modules/integrations/   settings read/update/test-connection
quotation / finance  thin controllers calling pdf + mail orchestration
```

Secrets stay in env (and write-only settings updates that set “configured” flags). Frontend never receives secrets.

**BullMQ:** not introduced in M3 unless sync send proves insufficient. Redis remains auth/health only.

---

## M3.1 — PDF generation

### Backend

- Add dependency: `pdfkit` + `@types/pdfkit`.
- `PdfDocumentService`:
  - `buildQuotationPdf(tenant, quotation, customer, lineItems, branding)`
  - `buildInvoicePdf(tenant, invoice, booking, customer, lineItems, paymentsSummary, branding)`
  - Totals **copied** from persisted amounts (never recompute business rules in PDF).
- Endpoints:
  - `GET /api/v1/quotations/:id/pdf` — `quotations:read`
  - `GET /api/v1/invoices/:id/pdf` — `invoices:read`
  - Response: `application/pdf`, `Content-Disposition: attachment; filename="…"`.
- Filename uses human numbers (`Q-00042-r1.pdf`, `INV-00007.pdf`), not raw UUIDs in the document body.
- Audit: `quotation.pdf_generated` / `invoice.pdf_generated` (optional, best-effort).

### Frontend

- Quotation detail: “Download PDF” button.
- Invoice / booking finance: “Download invoice PDF”.
- Use blob download via existing API client (`responseType: 'blob'`).

### Tests

- Unit: line rendering, missing venue/email, multi-page line flood, total equality.
- HTTP/guard: unauthorized without permission / wrong tenant.

---

## M3.2 — Document storage

### Schema

Migration adding `StoredDocument` + enums (see recon).

### Storage

- `StoragePort`: `put`, `getStream`, `delete`, `exists`.
- `LocalStorageAdapter`: root `STORAGE_LOCAL_ROOT` or `./.data/storage` (gitignored).
- `S3StorageAdapter`: when `STORAGE_ENDPOINT` + keys + bucket present.
- Validation: MIME allowlist (PDF, JPEG, PNG, WEBP, DOC/DOCX optional), max bytes from env `STORAGE_MAX_UPLOAD_BYTES` (default 10485760).

### API

- `POST /api/v1/documents` multipart — `documents:write`
- `GET /api/v1/documents?customerId|quotationId|bookingId` — `documents:read`
- `GET /api/v1/documents/:id/download` — `documents:read`
- `DELETE /api/v1/documents/:id` — `documents:write` (soft-delete + blob delete)

### Frontend

- Extend booking documents panel + customer documents section.
- Confirm delete dialog; loading/empty/error states.

### Tests

- Valid upload, bad MIME, oversized, unauthorized, download, delete removes blob.

---

## M3.3 — Email delivery

### Mail port

```ts
send(message: { to, subject, html, text?, attachments?, idempotencyKey? }): Promise<MailResult>
```

Adapters: `test` (in-memory captures), `smtp` (nodemailer).

### Orchestration

- `POST /api/v1/quotations/:id/email` body `{ to?: string }` — `quotations:send`
  - Resolve recipient: body.to → customer.primaryEmail → 400 if missing
  - Generate PDF → attach → create `CommunicationRecord` (channel email, status queued/sent/failed)
  - Does **not** change quotation status to accepted/approved
- `POST /api/v1/invoices/:id/email` — `invoices:send`
  - Same pattern; does **not** mark paid; status `send` remains a separate explicit action if operators still use it
- Idempotency: reject duplicate send within N seconds for same entity+recipient OR require client idempotency key

### Templates

- Simple HTML + text templates branded with `TenantSettings.businessName` / from identity.

### Webhooks (optional)

- `POST /api/v1/integrations/email/webhook` with shared-secret header — updates `CommunicationRecord` status.
- SMTP-only deployments: document “accepted ≠ delivered”.

### Tests

- Test adapter success/failure; attachment present; duplicate prevention; no payment mutation.

---

## M3.4 — Communication history

- Ensure list endpoints filter by customer / booking / quotation / invoice.
- Portal widgets on customer detail, booking finance, quotation detail.
- Display: subject, recipient, status, timestamps, sanitized failure reason.
- Preserve rows when quotation revises (link by id; no cascade delete of history).

---

## M3.5 — Integration settings + E2E

### API

- `GET /api/v1/integrations/settings` — `settings:read` (masked)
- `PATCH /api/v1/integrations/settings` — `settings:write` (write-only secrets)
- `POST /api/v1/integrations/settings/test-email` — `settings:write`
- `POST /api/v1/integrations/settings/test-storage` — `settings:write`
- Audit on change.

### Frontend

- Replace Integrations placeholder with real form + status badges (configured / unconfigured / failed).

### Playwright (isolated)

1. Open quotation → download PDF  
2. Email quotation (test adapter) → communication record  
3. Open booking → upload document → download  
4. Invoice PDF → email invoice → history  

Use existing e2e compose ports pattern; do not overwrite `.env` / `.env.local`.

### Final docs

- `M3_IMPLEMENTATION_REPORT.md`
- `M3_GAP_ANALYSIS.md`
- Update OpenAPI export if workflow requires

---

## Env vars (new / optional)

| Variable | Purpose |
|----------|---------|
| `STORAGE_PROVIDER` | `local` \| `s3` \| `none` |
| `STORAGE_LOCAL_ROOT` | Local adapter root |
| `STORAGE_ENDPOINT` / `ACCESS_KEY` / `SECRET_KEY` / `BUCKET` | S3 |
| `STORAGE_MAX_UPLOAD_BYTES` | Size limit |
| `MAIL_PROVIDER` | `test` \| `smtp` \| `none` |
| `MAIL_FROM_NAME` / `MAIL_FROM_EMAIL` | Sender identity |
| `SMTP_HOST` / `PORT` / `USER` / `PASS` / `SECURE` | SMTP |
| `MAIL_WEBHOOK_SECRET` | Optional webhook auth |
| `MAIL_IDEMPOTENCY_WINDOW_SEC` | Duplicate send window |

Validate optionally in `env.schema` (soft: defaults to test/local in non-production).

---

## Out of scope (explicit)

WhatsApp, Razorpay, SMS, AI, multi-tenant SaaS, public portal, Kafka, K8s, BullMQ workers (unless later justified), microservices.

---

## Progress tracking

| Sub-milestone | Status |
|---------------|--------|
| Phase 0 recon + plan | Done |
| M3.1 PDF | Done |
| M3.2 Documents | Done (S3 live verify outstanding) |
| M3.3 Email | Done (SMTP live verify outstanding) |
| M3.4 History | Partial (records written; dedicated widgets light) |
| M3.5 Settings + E2E + reports | Partial (guidance UI + reports; CRUD/E2E outstanding) |

---

*End of M3 implementation plan.*
