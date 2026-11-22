# Event OS — F1-07 Quotation Management Report

| Field | Value |
|-------|-------|
| **Feature** | Quotation hub / create / detail / header edit + lifecycle actions |
| **Requested by** | User (F1-07) — scope **option 1 — Narrow F1-07** after API vs docs review |
| **EP1 Requirements** | EP1-FIN-001 (event-linked quotations; line-item UI deferred for missing read API) |
| **Scope** | Hub, create, view-by-id, edit-by-id (draft header), send / approve / reject / revise |
| **Explicitly out of scope** | List; PDF; line-item list/editor; standalone convert-to-booking; channel/recipient on send |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Quotation Management** against frozen `/api/v1/quotations` endpoints only:

- **Hub** (`/app/quotations/`) — documents missing `GET /quotations`; CTA to create
- **Create** (`/app/quotations/new/`) — `customerId` + `leadId` (required), optional `validUntil` / `notes`
- **Details** (`/app/quotations/view/?id=`) — header + **server** pricing totals; actions by status
- **Edit** (`/app/quotations/edit/?id=`) — draft-only PATCH (`validUntil`, `notes`, `discountAmount`, `taxAmount`) + `If-Match`

Lifecycle: send / approve / reject / revise with permissions and `If-Match`. Approve may surface `eventId` when booking conversion succeeds (side effect — not a separate convert API).

**Deferred:** list, PDF, all line-item UI (no line-item read / no embed on GET).

---

## 2. API vs Documentation Review

| Item | Docs / EP1 | Frozen OpenAPI | Frontend decision |
|------|------------|----------------|-------------------|
| List | `GET /quotations` (`docs/09`) | **Missing** | Hub only |
| PDF | `GET …/pdf`; Bible QC-03 | **Missing** | Deferred |
| Create body | eventType, venue, terms, `clientId`, … | `leadId` + `customerId` (+ optional validUntil/notes) | OpenAPI fields only |
| Update body | terms/notes | validUntil, notes, discount, tax + `If-Match` | Those fields only |
| Send | `{ channel, recipient }` | Empty body + `If-Match` | Confirm send only |
| Line items | EP1-FIN-001 full manage | Mutate APIs exist; **no GET / embed** | **No line-item UI** |
| Convert to booking | Approve → Event chain | Approve side effect (`eventId`) | Toast on approve; no Convert button |
| Customer approval portal | Deferred Doc `19` | Staff approve/reject | Staff actions only |

No invented endpoints, list scrapes, or client-side pricing engines.

---

## 3. Files Changed

### Created

- `src/features/quotations/api/quotations.api.ts`
- `src/features/quotations/api/quotations.api.spec.ts`
- `src/features/quotations/schemas/quotation.schemas.ts`
- `src/features/quotations/schemas/quotation.schemas.spec.ts`
- `src/features/quotations/hooks/use-quotation-queries.ts`
- `src/features/quotations/lib/format.ts`
- `src/features/quotations/components/quotations-hub-page.tsx`
- `src/features/quotations/components/quotation-forms.tsx`
- `src/features/quotations/components/create-quotation-page.tsx`
- `src/features/quotations/components/quotation-detail-page.tsx`
- `src/features/quotations/components/edit-quotation-page.tsx`
- `src/features/quotations/index.ts`
- `src/app/app/quotations/new/page.tsx`
- `src/app/app/quotations/view/page.tsx`
- `src/app/app/quotations/edit/page.tsx`
- `EventOS-F1-07-Quotation-Management-Report.md`

### Modified

- `src/app/app/quotations/page.tsx` — hub instead of placeholder

---

## 4. Implementation

### Hub

EmptyState explaining missing list API; create CTA under `quotations:write`.

### Create

RHF + Zod → `POST /quotations` → redirect to view `?id=`.

### Detail

Displays QuotationDto fields and server totals (subtotal / discount / tax / total). Documents that line rows cannot be shown.

### Edit

Draft-only; unsaved-change warning; `If-Match`.

### Actions

| Status | Actions |
|--------|---------|
| `draft` | Edit, Send (`quotations:send`) |
| `sent` | Approve (`quotations:approve`), Reject (`quotations:reject`) |
| not `superseded` | Revise (`quotations:revise`) → navigate to new draft id |

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **56 passed** |
| `pnpm build` | **PASS** |

---

## 6. Build Status

`NODE_ENV=production next build` succeeded; static export includes:

- `/app/quotations/`
- `/app/quotations/new/`
- `/app/quotations/view/`
- `/app/quotations/edit/`

---

## 7. Test Status

Unit tests cover schema parse/map and API client wiring (create/get/update/send/approve/reject/revise + `If-Match`). Manual E2E against a live API was not run in this session.

---

## 8. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen quotations API | **Yes** |
| No list / PDF / invent line-item read | **Yes** |
| Permissions match RBAC | **Yes** |
| Server totals only (no invented calc) | **Yes** |
| F1-01–F1-03 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for hub/create/detail/header-edit + lifecycle; line items and list blocked on backend.

---

## 9. Known Backend Limitations

1. **No `GET /api/v1/quotations`** — cannot browse or search.
2. **No PDF endpoint** — cannot download/view official PDF offer.
3. **No line-item read** — mutate routes exist but GET quotation does not embed lines; UI cannot list/edit existing lines faithfully.
4. **Create cannot set** eventType / venue / terms / event dates (not in OpenAPI body).
5. **Send accepts no channel/recipient** despite `docs/09`.
6. **Send/approve** require line items + positive total on the server — without a line-item write UI in F1-07, operators must populate lines via API/other tooling before Send works.
7. Detail/edit use **`?id=`** (static export).
8. OpenAPI response `data` untyped — Zod runtime parse used.

---

## 10. Suggestions / Next Steps

1. Backend: ship `GET /quotations` and embed or `GET …/line-items` (and optionally PDF) so F1-07 can be widened.
2. When line reads exist, add draft line-item editor; Send becomes usable end-to-end from UI alone.
3. **F1-08 — Booking Management**
4. F1-09 Event Workspace → F1-10 Vendors → F1-11 Staff
