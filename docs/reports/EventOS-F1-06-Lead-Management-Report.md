# Event OS — F1-06 Lead Management Report

| Field | Value |
|-------|-------|
| **Feature** | Lead list / create / detail + stage, assign, follow-up |
| **Requested by** | User (F1-06) — scope **option 1 — Narrow F1-06** after API vs docs review |
| **EP1 Requirements** | EP1-LED (pipeline ops aligned to shipped lead endpoints) |
| **Scope** | List, create, view-by-id; stage change; assign; schedule follow-up |
| **Explicitly out of scope** | Pipeline board (`GET /leads/pipeline`); general `PATCH /leads/:id`; follow-up list / stage history / duplicates; server pagination/search/sort |

---

## 1. Executive Summary

Implemented narrowed Phase 1 **Lead Management** against frozen `/api/v1/leads` endpoints only:

- **List** (`/app/leads/`) — `GET /leads` full tenant list as returned (no query params)
- **Create** (`/app/leads/new/`) — RHF + Zod → `POST /leads` → redirect to view
- **Details** (`/app/leads/view/?id=`) — `GET /leads/:id` + actions:
  - **Stage** — `PATCH /leads/:id/stage` + `If-Match`
  - **Assign** — `POST /leads/:id/assign` + `If-Match` (staff UUID text field)
  - **Follow-up** — `POST /leads/:id/follow-ups` (create only; no list API)

Permissions use backend keys: `leads:read`, `leads:write`, `leads:stage:update`, `leads:assign`, `leads:followups:write`.

Query-param IDs keep static export compatible (no dynamic `[id]` segments).

---

## 2. Files Changed

### Created

- `src/features/leads/api/leads.api.ts`
- `src/features/leads/api/leads.api.spec.ts`
- `src/features/leads/schemas/lead.schemas.ts`
- `src/features/leads/schemas/lead.schemas.spec.ts`
- `src/features/leads/hooks/use-lead-queries.ts`
- `src/features/leads/lib/format.ts`
- `src/features/leads/components/leads-list-page.tsx`
- `src/features/leads/components/create-lead-page.tsx`
- `src/features/leads/components/lead-detail-page.tsx`
- `src/features/leads/index.ts`
- `src/app/app/leads/new/page.tsx`
- `src/app/app/leads/view/page.tsx`
- `EventOS-F1-06-Lead-Management-Report.md`

### Modified

- `src/app/app/leads/page.tsx` — list instead of placeholder

---

## 3. Implementation

### List

`GET /api/v1/leads` → Zod-parsed array → DataTable (stage, source, event type, start, budget, view action). No client inventing of server search/pagination.

### Create

OpenAPI create body: source (incl. `manual`), optional sourceDetail, eventType, eventDate range, venue, estimatedBudget (INR), guestCount, notes.

### Detail + mutations

- Stage transitions mirror backend allowed-from rules (`allowedStagesFrom`)
- Stage/assign send `If-Match: "<version>"`
- Assign accepts staff UUID (no staff picker API in F1-06)
- Follow-up: datetime-local → ISO `dueAt`; success toast only (cannot refresh a follow-up list)

### Permissions

| Surface | Permission |
|---------|------------|
| List / view | `leads:read` |
| Create | `leads:write` |
| Stage panel | `leads:stage:update` |
| Assign panel | `leads:assign` |
| Follow-up panel | `leads:followups:write` |

### Shared reuse

PageLayout/Header/Section, ContentCard, Empty/Loading/Error, DataTable, forms, toasts, breadcrumbs, RequirePermission/Can.

---

## 4. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test` | **45 passed** |
| `pnpm build` | **PASS** |

Manual E2E against a live API was not run in this session; unit tests cover schema mapping, stage rules, and API client wiring (incl. `If-Match`).

---

## 5. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Aligned with frozen leads API | **Yes** |
| No pipeline / general PATCH / invent list query | **Yes** |
| Permissions match RBAC | **Yes** |
| F1-01–F1-03 architecture preserved | **Yes** |

**Verdict: APPROVE (narrowed scope)** — production-ready for list/create/detail + stage/assign/schedule-follow-up.

---

## 6. API vs Documentation Review

| Item | Docs / EP1 expectation | Shipped OpenAPI / API | Frontend decision |
|------|------------------------|------------------------|-------------------|
| Lead list | Often with filters/pagination | `GET /leads` — full list, **no** query params | Plain table of returned rows |
| Pipeline view | `GET /leads/pipeline` (docs) | **Not** in frozen OpenAPI | Deferred; not called |
| Lead update | General edit | No general `PATCH /leads/:id` | Deferred |
| Stage change | Stage transition | `PATCH /leads/:id/stage` + `If-Match` | Implemented |
| Assign | Assign owner | `POST /leads/:id/assign` + `If-Match` | Implemented (UUID field) |
| Follow-ups | Create + list/history | Create only (`POST …/follow-ups`); **no** GET-by-lead | Schedule only; no list UI |
| Stage history / duplicates | Documented elsewhere | Not in OpenAPI | Deferred |

No invented endpoints. Where docs promised more than OpenAPI ships, scope was narrowed (option 1).

---

## 7. Known Limitations

1. **No pipeline board** — `GET /leads/pipeline` not shipped.
2. **No general lead edit** — no `PATCH /leads/:id`.
3. **No follow-up list / stage history / duplicate detection** — not in API.
4. **No server pagination/search/sort** — list is full tenant dump as returned.
5. **Assign** requires raw staff UUID until a staff picker API/UI exists.
6. Detail uses **`?id=`** (static export).
7. Response OpenAPI `data` still untyped — Zod runtime parse used.

---

## 8. Suggestions / Next Steps

1. Backend: pipeline endpoint and/or follow-up list when product needs them
2. Staff picker for assign when staff list API is ready for UI
3. **F1-07 — Quotation Management**
