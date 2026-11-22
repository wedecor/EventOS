# Event OS — F1-13 Finance Management Report

| Field | Value |
|-------|-------|
| **Feature** | Finance hub + booking financial panels |
| **Requested by** | User (F1-13) — scope **Option 2** after API vs docs review |
| **EP1 Requirements** | EP1-FIN-002–005; EP1-BR-002 surface via invoice/complete gates |
| **Scope** | Hub by booking id; payments list/record/void; invoices list/create/send/void; expenses list/record/void; profitability read |
| **Explicitly out of scope** | Global lists; GET-by-id; proof upload; PDF/receipts; refunds; advance/balance payment kinds; quotations (F1-07) |

---

## 1. Executive Summary

Implemented Phase 1 **Finance** against frozen booking-scoped finance APIs:

- **Hub** (`/app/finance/`) — no global lists; open by booking id
- **Booking panels** (`/app/finance/booking/?id=`) — profitability, payments, invoices, expenses
- **Booking detail** link → Finance for the same booking

Writes use flat `amount` + `currency` (OpenAPI), voids/sends send `If-Match`.

---

## 2. API vs Documentation Review

| Conflict | Docs / Bible | Frozen API | How handled |
|----------|--------------|------------|-------------|
| Money on payment/expense | Nested Money samples in `docs/09` | Flat `amount` + `currency` | Follow OpenAPI |
| Invoice customer field | `clientId` sample | `customerId` | Follow OpenAPI |
| Global finance lists | Reporting desire | **Missing** | Hub + booking id |
| Proof upload | EP1-FIN-003 proofs | Optional `attachmentId` only | `missingProofReason`; no upload UI |
| Invoice PDF | QB / EP1-FIN-002 | **Missing** | Deferred |
| Advance/balance kinds | Bible intent | No enum | Plain payment records |
| Profitability depth | Planned vs actual | revenue / expenses / margin | Display three fields only |

---

## 3. Files Changed

### Created

- `src/features/finance/api/finance.api.ts`
- `src/features/finance/api/finance.api.spec.ts`
- `src/features/finance/schemas/finance.schemas.ts`
- `src/features/finance/schemas/finance.schemas.spec.ts`
- `src/features/finance/hooks/use-finance-queries.ts`
- `src/features/finance/lib/format.ts`
- `src/features/finance/components/finance-hub-page.tsx`
- `src/features/finance/components/booking-finance-page.tsx`
- `src/features/finance/components/payments-panel.tsx`
- `src/features/finance/components/invoices-panel.tsx`
- `src/features/finance/components/expenses-panel.tsx`
- `src/features/finance/components/profitability-panel.tsx`
- `src/features/finance/index.ts`
- `src/app/app/finance/booking/page.tsx`
- `EventOS-F1-13-Finance-Management-Report.md`

### Modified

- `src/app/app/finance/page.tsx` — hub instead of placeholder
- `src/features/bookings/components/booking-detail-page.tsx` — Finance link
- `src/shared/lib/breadcrumbs.ts` — `booking` title under finance

---

## 4. Implementation

### Module

Feature-first `src/features/finance/` with Zod parse, TanStack Query, shared page kit + DataTable + ConfirmDialog.

### API integration

| Client | Endpoint |
|--------|----------|
| `listPayments` / `recordPayment` / `voidPayment` | booking payments + `POST /payments` (+ void) |
| `listInvoices` / `createInvoice` / `sendInvoice` / `voidInvoice` | booking invoices + invoice commands |
| `listExpenses` / `recordExpense` / `voidExpense` | booking expenses + void |
| `getProfitability` | `GET /bookings/:id/profitability` |

### Permissions

| Surface | Permission |
|---------|------------|
| Hub / panels gate | any of read keys |
| Payments | `payments:read` / `record` / `void` |
| Invoices | `invoices:read` / `write` / `send` / `void` |
| Expenses | `expenses:read` / `write` / `void` |
| Profitability | `profitability:read` |

---

## 5. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **103 passed** |
| `pnpm build` | **PASS** |

---

## 6. Build Status

**PASS** — static export includes `/app/finance/` and `/app/finance/booking/`.

---

## 7. Test Status

**PASS** — schema + API client coverage for payments, invoices, expenses, profitability, `If-Match` voids/sends.

---

## 8. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen finance/payments APIs | **Yes** |
| No invent PDF/upload/global list/refunds | **Yes** |
| Permissions match RBAC | **Yes** |
| F1-01–F1-12 architecture preserved | **Yes** |

**Verdict: APPROVE (Option 2 scope)** — production-ready for booking-scoped finance panels.

---

## 9. Known Backend Limitations

1. **No global finance lists** — booking id required.
2. **No GET-by-id** for payment/invoice/expense — actions use ids from booking lists.
3. **No attachment upload** — proofs cannot be uploaded in Phase 1 UI.
4. **No invoice PDF**.
5. **No refund** APIs.
6. Payment/expense status strings are backend-owned (e.g. confirmed/void); UI displays as returned.
7. Invoice `partially_paid` / `paid` not driven by dedicated frontend commands.

---

## 10. Suggestions / Next Steps

1. **F1-14 — Reports & Analytics**
2. Later: attachment upload + PDF when Attachment / document APIs land
3. **F1-15 — Settings**
