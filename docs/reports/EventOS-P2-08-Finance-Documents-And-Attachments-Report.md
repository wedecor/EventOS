# Event OS — P2-08 Finance Documents & Attachments Report


| Field              | Value                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Feature**        | Financial document metadata, verification lifecycle, linking, audit, workspace composition               |
| **Authority**      | Business Bible, Domain Model, existing Payment/VendorExpense/Invoice, Workspace, OpenAPI, Prisma         |
| **Scope**          | Metadata-only documents, verify/reject/soft-delete, optional finance links, workspace progress/activity  |
| **Business Bible** | Unchanged                                                                                                |
| **Date**           | 2026-07-19                                                                                               |


---

## 1. Executive Summary

P2-08 extends the **Finance** module with booking-owned **FinancialDocument** evidence records without redesigning Payment, VendorExpense, Invoice, profitability, or Event Workspace.

Documents store **metadata only** (`fileName`, `mimeType`, `fileSizeBytes`, `storageKey`) — no binary storage and no PDF generation. Verification flows `pending → verified | rejected`; soft delete uses `deletedAt`. Optional links to Payment / VendorExpense / VendorProcurement / Invoice; **booking is required**. Workspace remains a thin composition surface: `WorkspaceDto` unchanged; progress gains additive `financeDocuments`; activity gains `document_*` events.

**Verdict: APPROVED WITH MINOR NOTES**

---



## 2. Architecture Compliance


| Rule                                        | Status                                                         |
| ------------------------------------------- | -------------------------------------------------------------- |
| Preserve Payment / VendorExpense / Invoice  | ✅ Unchanged aggregates and APIs                                |
| Preserve profitability                      | ✅ Read model untouched                                         |
| Preserve Workspace composition              | ✅ Thin GET; additive progress/activity only                    |
| Booking ownership                           | ✅ `bookingId` required on every document                       |
| Additive APIs / DB only                     | ✅ New tables, routes, permissions                              |
| No binary storage / PDF generation          | ✅ Metadata fields only                                         |
| Business Bible unchanged                    | ✅                                                              |
| DDD boundaries                              | ✅ Finance module owns document lifecycle                       |


---



## 3. Backend Changes


| Area                                       | Change                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `FinancialDocumentApplicationService`      | Create, get, update, verify, reject, soft-delete; list by booking / payment / expense           |
| Audit persistence                          | Append-only `FinancialDocumentAuditEvent` on upload/update/verify/reject/delete                 |
| Repositories                               | `FinancialDocumentRepository`, `FinancialDocumentAuditEventRepository`                          |
| Controllers                                | `/financial-documents`, `/payment-documents/:paymentId`, `/expense-documents/:expenseId`        |
| Booking controller                         | `GET /bookings/:id/financial-documents`                                                         |
| RBAC                                       | `documents:read`, `documents:write`, `documents:verify` (finance + viewer read; owner/admin all) |
| Workspace progress                         | Additive `financeDocuments` counters                                                            |
| Workspace activity                         | `document_uploaded` / `updated` / `verified` / `rejected` / `deleted`                           |


---



## 4. Database Changes

Migration `20260719100000_p2_08_financial_documents`:


| Change | Detail |
| ------ | ------ |
| Enum   | `financial_document_type` (`payment_proof`, `expense_receipt`, `vendor_invoice`, `customer_invoice`, `credit_note`, `debit_note`, `other`) |
| Enum   | `financial_document_verification_status` (`pending`, `verified`, `rejected`) |
| Enum   | `financial_document_audit_event_type` (`uploaded`, `updated`, `verified`, `rejected`, `deleted`) |
| Table  | `financial_documents` — booking FK required; optional payment / vendor_expense / vendor_procurement / invoice FKs; metadata columns; `deleted_at` |
| Table  | `financial_document_audit_events` — append-only trail |


---



## 5. API Changes

Payment / expense / invoice / profitability routes retained. Additive:


| Method   | Path                                          | Permission          |
| -------- | --------------------------------------------- | ------------------- |
| POST     | `/financial-documents`                        | `documents:write`   |
| GET      | `/financial-documents/:id`                    | `documents:read`    |
| PATCH    | `/financial-documents/:id`                    | `documents:write`   |
| POST     | `/financial-documents/:id/verify`             | `documents:verify`  |
| POST     | `/financial-documents/:id/reject`             | `documents:verify`  |
| POST     | `/financial-documents/:id/delete`             | `documents:write`   |
| GET      | `/financial-documents/:id/audit-events`       | `documents:read`    |
| GET      | `/payment-documents/:paymentId`               | `documents:read`    |
| GET      | `/expense-documents/:expenseId`               | `documents:read`    |
| GET      | `/bookings/:id/financial-documents`           | `documents:read`    |

Role matrix: **finance** gains read/write/verify; **viewer** gains read. OpenAPI regenerated.

---



## 6. Frontend Changes


| Area                    | Change                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Booking finance page    | `DocumentsPanel` — register metadata, list, verify/reject/soft-delete               |
| Event Workspace         | Finance card counters from `progress.financeDocuments`                              |
| Schemas / API / hooks   | Financial document parsers and mutations under finance feature                      |


---



## 7. Finance Document Lifecycle (Upload, Verification, Linking, Audit, Workspace)



### Upload (metadata register)

```
POST /financial-documents
  → verificationStatus = pending
  → audit event: uploaded
```

- Required: `bookingId`, `documentType`
- Optional metadata: `fileName`, `mimeType`, `fileSizeBytes`, `storageKey`, `description`
- Optional links: `paymentId`, `vendorExpenseId`, `vendorProcurementId`, `invoiceId`
- No binary body; no PDF generation



### Verification

```
pending → verified | rejected
```

- `POST …/verify` and `POST …/reject` require `documents:verify` + If-Match
- Stores `verifiedByUserId`, `verifiedAt`, optional `verificationNotes`



### Linking

- Booking always required
- Payment / expense / procurement / invoice links are optional and independent of Payment/Expense CRUD
- Sibling list routes: `/payment-documents/:paymentId`, `/expense-documents/:expenseId`



### Soft delete & audit

```
active → soft-deleted (deletedAt set)
```

- Audit events: `uploaded`, `updated`, `verified`, `rejected`, `deleted`
- Soft-deleted rows excluded from booking lists



### Workspace composition

| Concern | Integration |
| --- | --- |
| WorkspaceDto | **Not** expanded — thin status DTO preserved |
| Progress | Additive `financeDocuments` (total, pendingVerification, verified, rejected, missingPaymentProofs, outstandingActions) |
| Activity | Aggregated `document_*` events from audit trail |
| Event Workspace UI | Finance card counters; DocumentsPanel on booking finance |

---



## 8. Documentation Updates


| Document                                  | Update                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `docs/07-domain-model.md`                 | FinancialDocument + audit events near Finance/Attachment                |
| `docs/09-api-design.md`                   | Document endpoints; `documents:*`; finance/viewer matrix                |
| `docs/05-system-architecture.md`          | Thin workspace composes finance documents                               |
| `docs/10-implementation-specification.md` | Finance module P2-08 services/repos/controllers/migration               |
| OpenAPI                                   | Regenerated                                                             |
| Business Bible (`docs/business/`)         | **Unchanged**                                                           |


---



## 9. Testing


| Layer      | Result                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Unit       | Document create/verify/reject/soft-delete; workspace progress/activity |
| API        | **675** tests passed; lint + build green                               |
| Frontend   | **118** tests passed; typecheck + lint + build green                   |
| OpenAPI    | Regenerated (`openapi:export` + web `openapi:generate`)                |
| Validation | Metadata-only invariant; Payments/Expenses/Profitability preserved     |


---



## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Binary object-storage upload and signed URL delivery remain out of scope; operators register `storageKey` metadata only.
2. Platform `Attachment` polymorphic UUID pointers on Payment/Expense remain for Phase 1 compatibility; FinancialDocument is the Finance-owned evidence path going forward.
3. PDF generation and customer-facing document delivery are deferred.

### Recommended next milestone

**P2-09 — Communication Center**
