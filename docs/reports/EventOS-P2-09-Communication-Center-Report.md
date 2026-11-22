# Event OS — P2-09 Communication Center Report


| Field              | Value                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Feature**        | Shared operational Communication Center — records, templates, reminders, attachments, preferences                  |
| **Authority**      | Business Bible, Domain Model, Workspace composition, OpenAPI, Prisma                                               |
| **Scope**          | Manual communication log + templates + reminders; metadata attachments; preference storage; thin workspace         |
| **Business Bible** | Unchanged                                                                                                          |
| **Date**           | 2026-07-19                                                                                                         |


---

## 1. Executive Summary

P2-09 introduces a **shared Communication module** for operational communication logging without redesigning Customer, Staff, Vendor, Booking, CRM TimelineEntry, or Event Workspace ownership.

Operators can record multi-channel communications, reuse templates, attach **metadata-only** files, manage **manual** reminders, and store notification preferences. There is **no** WhatsApp/email/SMS provider integration, **no** background reminder scheduler, and **no** AI generation. Workspace remains a thin composition surface: `WorkspaceDto` unchanged; progress gains additive `communications`; activity gains `communication_*` / `reminder_*` events.

**Verdict: APPROVED WITH MINOR NOTES**

---



## 2. Architecture Compliance


| Rule                                           | Status                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| Preserve Customer / Staff / Vendor / Booking   | ✅ Aggregates unchanged; optional FK links only                     |
| Preserve CRM TimelineEntry                     | ✅ Distinct from CommunicationRecord                                |
| Preserve Workspace composition                 | ✅ Thin GET; additive progress/activity only                        |
| Shared Communication service                   | ✅ `apps/api/src/modules/communication/`                            |
| Additive APIs / DB only                        | ✅ New tables, routes, permissions                                  |
| No provider integration                        | ✅ No WhatsApp / email / SMS send                                   |
| No background scheduler                        | ✅ Reminders are create / complete / cancel only                    |
| No AI generation                               | ✅ Templates are static                                             |
| Metadata-only attachments                      | ✅ Same pattern as FinancialDocument                                |
| Business Bible unchanged                       | ✅                                                                  |
| DDD boundaries                                 | ✅ Communication module owns lifecycle                              |


---



## 3. Backend Changes


| Area                                      | Change                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `CommunicationApplicationService`         | Create, get, list, update, transition, soft-delete; attachment register/soft-delete            |
| `CommunicationTemplateApplicationService` | Create, list, update, archive                                                                  |
| `ReminderApplicationService`              | Create, list, complete, cancel (manual)                                                        |
| `NotificationPreferenceApplicationService`| Get / upsert customer preferences (storage only)                                               |
| Repositories                              | Record, Attachment, Template, Reminder, NotificationPreference                                 |
| Controllers                               | `/communications`, `/communication-templates`, `/reminders`, `/notification-preferences`       |
| Booking controller                        | `GET /bookings/:id/communications`, `GET /bookings/:id/reminders`                              |
| RBAC                                      | `communications:*`, `communication-templates:*`, `reminders:*`                                 |
| Workspace progress                        | Additive `communications` counters                                                             |
| Workspace activity                        | `communication_*` and `reminder_*` events                                                      |


---



## 4. Database Changes

Migration `20260719110000_p2_09_communication_center`:


| Change | Detail |
| ------ | ------ |
| Enum   | `communication_channel` (`whatsapp`, `email`, `sms`, `phone_call`, `internal_note`, `manual_meeting`) |
| Enum   | `communication_direction` (`incoming`, `outgoing`) |
| Enum   | `communication_status` (`draft`, `queued`, `sent`, `delivered`, `read`, `failed`, `cancelled`, `completed`) |
| Enum   | `communication_template_status` (`active`, `archived`) |
| Enum   | `reminder_status` (`pending`, `completed`, `cancelled`) |
| Enum   | `reminder_category` (`payment_follow_up`, `event_reminder`, `vendor_follow_up`, `customer_follow_up`, `staff_follow_up`, `other`) |
| Table  | `communication_templates` |
| Table  | `communication_records` — optional booking / customer / vendor / staff / template FKs; soft-delete |
| Table  | `communication_attachments` — metadata only; cascade from record |
| Table  | `reminders` — optional party + communication links; manual lifecycle |
| Table  | `notification_preferences` — WhatsApp / email / SMS booleans |


---



## 5. API Changes

Additive routes (Customer / Staff / Vendor / Booking CRUD retained):


| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET    | `/communications` | `communications:read` |
| GET    | `/communications/:id` | `communications:read` |
| GET    | `/communications/:id/attachments` | `communications:read` |
| POST   | `/communications` | `communications:write` |
| PATCH  | `/communications/:id` | `communications:write` |
| POST   | `/communications/:id/transition` | `communications:write` |
| POST   | `/communications/:id/delete` | `communications:write` |
| POST   | `/communications/:id/attachments` | `communications:write` |
| POST   | `/communications/:id/attachments/:attachmentId/delete` | `communications:write` |
| GET/POST/PATCH | `/communication-templates` (+ `/:id`, `/:id/archive`) | `communication-templates:read` / `write` |
| GET/POST | `/reminders` (+ `/:id/complete`, `/:id/cancel`) | `reminders:read` / `write` |
| GET    | `/bookings/:id/communications` | `communications:read` |
| GET    | `/bookings/:id/reminders` | `reminders:read` |
| GET/PUT | `/notification-preferences` | `clients:read` / `clients:write` |

Role matrix: **sales_manager**, **operations_manager**, **coordinator** gain read/write; **viewer** gains read. OpenAPI regenerated with module export.

---



## 6. Frontend Changes


| Area              | Change                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Feature module    | `apps/web/src/features/communications/` — schemas, API client, hooks   |
| Routes            | `/app/communications/`, `/new/`, `/view/`, `/templates/`, `/reminders/` |
| Dashboard         | Timeline-style list with channel/status filters and search             |
| Detail / create   | Metadata, attachments, related booking deep links, status transition   |
| Templates         | Create, edit, archive                                                  |
| Reminders         | List, create, complete, cancel                                         |
| Navigation        | Communications nav entry + breadcrumbs                                 |
| RBAC              | `communications:*`, `communication-templates:*`, `reminders:*` synced  |
| Event Workspace   | Communications summary card (counters + deep links to center)          |


---



## 7. Communication Lifecycle (Records, Templates, Reminders, Timeline, Workspace)



### Records

```
POST /communications
  → status = draft | queued | completed (manual channels only)
POST …/transition
  → draft → queued → sent → delivered → read
  → failed / cancelled branches per ALLOWED_TRANSITIONS
POST …/delete
  → soft-delete (deletedAt)
```

- Optional links: booking, customer, vendor, staff, template
- Channels include provider-named enums for future use; **no send** in P2-09
- Attachments: metadata register only (`fileName`, `mimeType`, `fileSizeBytes`, `storageKey`)



### Templates

```
active → archived
```

- Seed subject/body/channel onto records; no AI drafting



### Reminders

```
pending → completed | cancelled
```

- Manual only — no cron / queue / push delivery
- Optional links to booking / customer / vendor / staff / communication



### Timeline vs Communication Center

| Concern | Owner |
| --- | --- |
| CRM `TimelineEntry` | CRM `/clients/:id/interactions` — customer interaction adjunct |
| `CommunicationRecord` | Communication module — shared operational log |
| `EventNote` | Booking workspace — internal ops notes |



### Workspace composition

| Concern | Integration |
| --- | --- |
| WorkspaceDto | **Not** expanded — thin status DTO preserved |
| Progress | Additive `communications` (total, failed, pendingReminders, overdueReminders, outstandingActions) |
| Activity | Aggregated `communication_*` and `reminder_*` events |
| Aggregates | Customer / Staff / Vendor / Booking preserved |

---



## 8. Documentation Updates


| Document                                  | Update                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `docs/07-domain-model.md`                 | CommunicationRecord, Template, Reminder, Attachment, NotificationPreference      |
| `docs/09-api-design.md`                   | Endpoints; permissions; booking nested lists; matrix grants                      |
| `docs/05-system-architecture.md`          | Shared Communication service; thin workspace composition                         |
| `docs/10-implementation-specification.md` | Communication module + migration `20260719110000_p2_09_communication_center`     |
| OpenAPI                                   | Regenerated                                                                      |
| Business Bible (`docs/business/`)         | **Unchanged**                                                                    |


---



## 9. Testing


| Layer      | Result                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Unit       | Communication create/transition/soft-delete; reminder complete/cancel; workspace progress/activity covered |
| API        | **685** tests passed; lint + build passed                              |
| Frontend   | **118** tests passed; typecheck + lint + build passed                  |
| OpenAPI    | Regenerated (`openapi:export` + web `openapi:generate`)                |
| Validation | No provider send; no scheduler; metadata-only attachments; aggregates preserved |


---



## 10. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. Provider integrations (WhatsApp / email / SMS) remain out of scope; channel enums are forward-compatible only.
2. Reminder due dates do not trigger notifications or jobs — operators must complete/cancel manually.
3. Binary object-storage upload for communication attachments remains metadata-pointer only (`storageKey`).
4. Dedicated frontend unit tests for Communication Center screens were not added; coverage relies on API unit tests plus web suite regression.

### Recommended next milestone

**P2-10 — Calendar & Operational Timeline**
