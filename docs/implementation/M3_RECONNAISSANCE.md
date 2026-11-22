# M3 — Integration Foundation Reconnaissance

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Branch** | `release/m0-m1-core-workflows` |
| **HEAD at recon** | `6a0dc10` (docs tip after M2) |
| **Preserved M2 commit** | `d8ed43cbfc27a490ccbe9703d0edf67cc60ba7cc` |
| **Working tree** | Clean (no unexpected changes) |
| **Baseline re-run** | API **705** passed · Web **121** passed |

---

## 0. Source documents (verified locations)

Prompt paths vs actual locations:

| Prompt path | Actual path | Notes |
|-------------|-------------|-------|
| `docs/EVENTOS_PROJECT_STATUS.md` | `docs/audit/EVENTOS_PROJECT_STATUS.md` | Audit ref `91feb7b`; M0–M2 advances supersede some “missing” claims (booking complete now works) |
| `docs/EVENTOS_FEATURE_MATRIX.md` | `docs/audit/EVENTOS_FEATURE_MATRIX.md` | Still accurate on PDF/email/storage = not implemented |
| `docs/EVENTOS_ARCHITECTURE_REVIEW.md` | `docs/audit/EVENTOS_ARCHITECTURE_REVIEW.md` | Integration boundary still documentation-shaped |
| `docs/EVENTOS_GAP_ANALYSIS.md` | `docs/audit/EVENTOS_GAP_ANALYSIS.md` | PDF / mail / object storage = high gap |
| `docs/EVENTOS_IMPLEMENTATION_ROADMAP.md` | `docs/audit/EVENTOS_IMPLEMENTATION_ROADMAP.md` | M3 = PDF + files + email (+ optional BullMQ) |
| Release reports | `docs/release/M0_M1_*`, `M2_*` | Current; M2 live E2E + commit evidence |

Do **not** treat audit docs as absolute after M0–M2; verify against code.

---

## 1. Existing reusable functionality

### Domain modules (Nest)

| Area | Path | Reusable for M3 |
|------|------|-----------------|
| Quotation | `modules/quotation/` | Totals, line items, customer/event fields, `quotations:send` |
| Booking / Event | `modules/booking/` | Workspace, finance surfaces, ownership |
| Invoice | `modules/finance/` (`invoice.application.service`) | Draft create, status `send`/`void`, totals from lines |
| Payment | `modules/payment/` | Paid amounts for invoice PDF outstanding balance |
| Customer | `modules/customer/` | `primaryEmail`, contacts |
| Financial documents | `modules/finance/` (`financial-document.*`) | Metadata CRUD + verify + soft delete; **no binary** |
| Communication center | `modules/communication/` | `CommunicationRecord` status machine, templates, attachment metadata |
| Tenant settings | `modules/tenant/` | Business name (branding); KPI settings only |
| Auth / RBAC | `modules/auth/domain/rbac.ts` | `documents:*`, `communications:*`, `invoices:send`, `quotations:send`, `settings:*` |
| Audit | `shared/audit/audit-log.service.ts` | Best-effort `record()`; extend `AUDIT_ACTIONS` |
| Redis | `database.module` + login throttle + health | Available; **not** used for queues |
| BullMQ | `package.json` only | **Zero imports** — do not invent workers without need |
| Storage prep | `infrastructure/storage/` | Env contract `STORAGE_*`; no SDK |

### Prisma (54 models)

Already present and relevant:

- `Quotation` / `QuotationLineItem` — numbers, validity, discounts/tax/totals
- `Invoice` / `InvoiceLineItem` — invoice number, totals, `sentAt`
- `FinancialDocument` — booking-scoped finance attachment **metadata** (`storageKey`)
- `CommunicationRecord` — channel/status/recipient-ish fields via subject/body; statuses include `queued|sent|delivered|failed`
- `CommunicationAttachment` — metadata only
- `TenantSettings.businessName`
- `AuditLog`

### Frontend

- Quotation detail (send dialog exists — status-only today)
- Booking finance + `documents-panel.tsx` (explicitly metadata-only)
- Communications hub + customer 360 timeline
- Settings → Integrations = `ModulePlaceholderPage`
- Static export (`output: 'export'`) — all upload/download via Nest, not Next routes
- Blob download pattern in analytics export

### Historical PDF (not on HEAD)

Commit `c00d3be` added hand-rolled `shared/pdf/minimal-quotation-pdf.ts` (ASCII Helvetica, single page, no library). Useful as a reference for zero-dep PDF structure; **insufficient** for branded multi-page quotation/invoice. Prefer a real server-side library for M3.

---

## 2. Missing functionality

| Capability | Gap |
|------------|-----|
| Quotation / invoice PDF bytes | No library, no service, no endpoints |
| Binary upload / download / delete | Metadata APIs only; no multer/S3/local adapter |
| Email send | No provider; quotation/invoice `send` = status flip |
| Delivery tracking | Status enums exist; no provider IDs / webhooks |
| Quotation/invoice link on `CommunicationRecord` | No `quotationId` / `invoiceId` / `providerMessageId` |
| Generic ops documents (contracts, event images, customer docs) | `FinancialDocument` is booking+finance-typed |
| Integration settings UI + API | Placeholder; secrets not in `env.schema` |
| PDF/email permissions nuance | Existing perms mostly enough; may add narrow actions if needed |

---

## 3. Proposed changes to existing modules

| Module | Change |
|--------|--------|
| `quotation` | Add `GET …/quotations/:id/pdf`; add explicit `POST …/quotations/:id/email` (does **not** auto-approve). Keep existing status `send` separate from email delivery. |
| `finance` / invoice | Add `GET …/invoices/:id/pdf`; add `POST …/invoices/:id/email` distinct from status `send`. |
| `finance` financial documents | Keep for payment proofs / receipts; optionally store generated invoice PDF metadata when linked to booking. |
| `communication` | Extend create/list filters for quotation/invoice; record outbound email lifecycle; safe failure reasons. |
| `tenant` / new integrations slice | Admin-managed non-secret defaults + masked secret indicators; env remains source for bootstrap secrets when DB unset. |
| `shared/audit` | New actions: `document.uploaded`, `document.deleted`, `quotation.pdf_generated`, `quotation.email_queued`, `invoice.email_queued`, `integration.settings_updated`. |
| Web quotations / finance / bookings / customer / settings | Download PDF, send email, documents panel (real upload), communication history widgets, integrations settings page. |

**Do not rewrite** quotation totals, invoice create, or communication status machine — extend them.

---

## 4. New models and migrations

Recommended **single migration** `m3_integration_foundation`:

1. **`StoredDocument`** (ops document asset)
   - Links: optional `customerId`, `quotationId`, `bookingId`, `invoiceId` (at least one required in app layer)
   - `category` enum: `quotation_pdf | invoice_pdf | customer_document | event_image | contract | other`
   - Metadata: `fileName`, `mimeType`, `fileSizeBytes`, `storageKey`, `storageProvider`, `checksumSha256?`
   - `uploadedByUserId`, `uploadedAt`, `deletedAt`, soft-delete
   - Indexes: `(tenantId, bookingId)`, `(tenantId, customerId)`, `(tenantId, quotationId)`

2. **`CommunicationRecord` extensions**
   - `quotationId?`, `invoiceId?`, `providerMessageId?`, `provider?`, `recipientAddress?`
   - Indexes for quotation/invoice lookups

3. **`IntegrationSettings`** (per-tenant, one row)
   - Email: `emailProvider` (`smtp` \| `resend` \| `test` \| `none`), `fromName`, `fromEmail`, `secretConfigured` flags (not plaintext in API)
   - Storage: `storageProvider` (`local` \| `s3` \| `none`), bucket/endpoint non-secret fields
   - Encrypted secret ciphertext columns **or** “configured via env” flags only — prefer: **secrets in env**; DB stores provider choice + public identity + `*_secretConfigured` booleans updated when admin saves (write-only secret fields accepted, never read back)

Avoid storing PDF binaries in Postgres.

---

## 5. Provider choices and trade-offs

### PDF

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Historical minimal PDF | Zero deps | ASCII-only, poor branding, no tables | Reject as primary |
| **PDFKit** | Nest-friendly, tables/text, multi-page, widely used | Manual layout | **Adopt** |
| Puppeteer HTML→PDF | Design fidelity | Heavy Chromium in API process | Defer |
| `@react-pdf/renderer` | React layout | Extra React runtime on API | Defer |

### Storage

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Local filesystem adapter** | Works offline/dev/E2E | Not multi-instance prod | Default when `STORAGE_*` unset |
| **S3-compatible** (`@aws-sdk/client-s3`) | Matches `infrastructure/storage` contract | Needs credentials | Implement adapter; live verify when creds exist |
| DB BYTEA | Simple | Wrong for large files | Reject |

### Email

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Nodemailer SMTP** | Universal (Gmail/SES SMTP/etc.) | Less fancy APIs | Primary production-shaped adapter |
| Resend HTTP API | Modern DX | Extra vendor lock | Optional later if env set |
| **TestMailAdapter** | Deterministic tests/E2E | Not real delivery | Required for CI/dev |
| BullMQ worker | Async, retries | Unused today; expands ops surface | **Defer** — sync send with status transitions is enough for M3 unless latency proves need |

### Delivery webhooks

Implement **optional** authenticated webhook endpoint for providers that support it (SMTP typically does not). Document as outstanding for pure SMTP. Test adapter can simulate status transitions in tests.

---

## 6. Security considerations

- AuthN + `@Permissions` on every new endpoint; tenant scoping on every query.
- Document download checks ownership of linked customer/quotation/booking/invoice.
- MIME allowlist + extension allowlist + max size (configurable, default 10–15 MB).
- Safe storage keys: `tenantId/yyyy/mm/uuid.ext` — never client-supplied paths.
- Soft-delete metadata then delete blob (or mark orphan for sweeper); never leave silent orphans without a documented strategy.
- Secrets: env / write-only settings; mask in API (`••••••` + `configured: true`); never log Authorization, SMTP passwords, or storage secrets.
- Email send must not mutate quotation acceptance or payment/invoice paid state.
- Idempotency key / short cooldown to prevent duplicate sends from double-clicks.
- Static export: CORS already credentialed; PDF responses as `application/pdf` attachment.
- OpenAPI update for new routes; no secret fields in schemas as readable.

---

## 7. Testing strategy

| Layer | Coverage |
|-------|----------|
| Unit | PDF content builders (totals from record, optional fields); storage validation; mail adapter; settings mask |
| Integration (API Jest) | Authz deny; upload/download/delete; email success/fail; communication record creation; webhook auth if present |
| Web Vitest | UI actions / API client helpers |
| Playwright (isolated E2E) | 10-step M3 journey with TestMailAdapter + local storage |
| Regression | Preserve ≥705 API / ≥121 web; M2 core workflow still green |

Baseline recorded this session: **705 / 121**.

---

## 8. Implementation sequence

1. **M3.1 PDF** — `pdfkit` service + quotation/invoice endpoints + portal download + tests  
2. **M3.2 Documents** — migration `StoredDocument` + local/S3 adapters + upload APIs + portal UI  
3. **M3.3 Email** — adapters + send endpoints + attach PDF + communication write  
4. **M3.4 History** — list/filter UI on customer/booking/quotation; status updates  
5. **M3.5 Settings + E2E** — integrations page, audit, Playwright, final docs  

No commits unless explicitly authorized.

---

## 9. Risks / blockers

| Risk | Mitigation |
|------|------------|
| No live SMTP/S3 credentials in this environment | Ship test + local adapters; document live verification as outstanding |
| `FinancialDocument` vs new `StoredDocument` confusion | Clear API naming; finance proofs stay on FinancialDocument; ops/M3 assets on StoredDocument |
| Quotation “Send” UX vs email send | Separate CTAs: “Mark sent” (existing status) vs “Email to customer” (M3) |
| Audit docs outdated post-M2 | Prefer this recon + code |

---

*End of M3 reconnaissance.*
