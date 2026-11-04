# Event OS — P2-02 Checklist Templates & Checklist Management Report

| Field | Value |
|-------|-------|
| **Feature** | Reusable Checklist Templates + Event Checklist execution |
| **Scope** | Additive Checklist domain; preserve Tasks + thin Workspace; progress integration |
| **Architecture stance** | Template → Event Checklist → Items (independent copies); Tasks unchanged |
| **Date** | 2026-07-19 |

---

## 1. Executive Summary

P2-02 introduces a dedicated **Checklist** aggregate for reusable templates and event-specific execution copies, without redesigning the Event Workspace or replacing Tasks.

- Templates are managed under Settings → Templates.
- Event checklists are generated as independent copies (template edits do not mutate in-flight events).
- Workspace prefers Event Checklists for checklist UI and progress; Task + Task `ChecklistItem` remain for P2-01 compatibility.
- `checklist.generate` suggestion accept now executes generation (no longer `NOT_IMPLEMENTED`).
- Business Bible was not modified.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Architecture Review

| Concern | Decision |
|---------|----------|
| `GET /bookings/:id/workspace` | **Unchanged** — thin composition DTO preserved |
| Task model | **Preserved** — category, priority, checklist items, completion notes remain |
| Named checklists via `Task.category` | Replaced in workspace UI by Event Checklists; Task checklist items still editable under Tasks |
| Checklist domain | New bounded context: Template → EventChecklist → Items |
| Progress | Same endpoint; prefers EventChecklist items when present, else Task checklist items |
| OpenAPI | Additive paths only; regenerated freeze artifact |

```
ChecklistTemplate (+ items)
        │ generate (copy)
        ▼
EventChecklist (+ items) ──► Workspace UI + Progress %
```

Tasks remain separate operational work items.

---

## 3. Domain Changes

| Aggregate | Role |
|-----------|------|
| `ChecklistTemplate` | Reusable template (name, description, eventTypes, category, status, templateVersion, sortOrder, rootTemplateId) |
| `ChecklistTemplateItem` | Ordered template rows (title, required, defaultAssigneeRole, estimatedDuration) |
| `EventChecklist` | Event-scoped copy with snapshotted template id/version |
| `EventChecklistItem` | Execution (complete/undo, notes, completedAt, completedBy) |

Administration: create, edit, archive, duplicate (version history via `rootTemplateId` + `templateVersion`). Item delete blocked when template has generated event checklists. No hard delete of used templates.

Generation: `POST /event-checklists/generate` or suggestion accept `checklist.generate` — matches active templates by event type (empty `eventTypes` = all); skips already-generated template+booking pairs.

---

## 4. Database Changes

Migration `20260719050000_p2_02_checklist_templates`:

- Enum `checklist_template_status` (`active` \| `inactive` \| `archived`)
- Tables: `checklist_templates`, `checklist_template_items`, `event_checklists`, `event_checklist_items`
- FKs to `tenants`, `events` (booking), optional `checklist_templates`, optional `users` (completedBy)
- Optimistic `version` columns on templates and items

Existing `tasks` / task `checklist_items` untouched. No data loss.

---

## 5. API Changes

Additive resources:

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/checklist-templates` | read / write |
| GET/PATCH | `/checklist-templates/:id` | read / write |
| GET | `/checklist-templates/:id/versions` | read |
| POST | `/checklist-templates/:id/archive` | write |
| POST | `/checklist-templates/:id/duplicate` | write |
| POST/PATCH/DELETE | `/checklist-templates/:id/items[/:itemId]` | write |
| GET | `/event-checklists?bookingId=` | read |
| POST | `/event-checklists/generate` | write |
| GET | `/event-checklists/:id` | read |
| PATCH | `/event-checklists/:id/items/:itemId` | execute |

RBAC: `checklists:read`, `checklists:write`, `checklists:execute` (owner/admin all; OM/coordinator full checklist set; viewer read).

Suggestion: `checklist.generate` → `EventChecklistApplicationService.generateFromTemplates()`.

---

## 6. Frontend Changes

| Area | Change |
|------|--------|
| Settings → Templates | Checklist template list/create/edit/archive/duplicate + add items |
| Event Workspace | “Event checklists” section with generate + complete/undo; replaces Task.category grouping |
| Tasks section | Unchanged — still supports task checklist items |
| Progress | Invalidates on generate / item update; backend prefers EventChecklist counts |
| Feature module | `apps/web/src/features/checklists/` |

Design system reused (`PageLayout`, `ContentCard`, `DataTable`, `Can` / `RequirePermission`).

---

## 7. Migration Strategy

| Existing data | Treatment |
|---------------|-----------|
| Tasks | Preserved |
| Task ChecklistItem | Preserved; still count toward progress when no EventChecklist items exist |
| New EventChecklists | Generated on demand (generate button or suggestion accept) — not auto-migrated from Task categories |
| Templates | Start empty; admins create/reuse as needed |

No destructive migration. P2-01 events continue to work with Task-based checklist progress until Event Checklists are generated.

---

## 8. Documentation Updates

| Document | Update |
|----------|--------|
| `docs/07-domain-model.md` | Checklist aggregate section; Task P2-02 note; bounded-context table |
| `docs/09-api-design.md` | Permissions, role lists, Checklist Management module, suggestion accept path |
| `apps/api/openapi/openapi.v1.json` | Regenerated with checklist paths |
| Business Bible | **Not modified** |

---

## 9. Testing

| Suite | Coverage |
|-------|----------|
| `ChecklistTemplateApplicationService` | create, duplicate versioning, archive, removeItem guard |
| `EventChecklistApplicationService` | generate copies, idempotent skip, complete item, NOT_FOUND |
| `WorkspaceProgressService` | Task checklist fallback; EventChecklist preference |
| `SuggestionApplicationService` | `checklist.generate` executes generation |

---

## 10. Validation Results

| Check | Result |
|-------|--------|
| API `pnpm lint` | PASS |
| API `pnpm test` | PASS — 656 tests |
| API `pnpm build` | PASS |
| Web `pnpm typecheck` | PASS |
| Web `pnpm lint` | PASS |
| Web `pnpm test` | PASS — 118 tests |
| Web `pnpm build` | PASS |
| Prisma migrate deploy | PASS (`20260719050000_p2_02_checklist_templates`) |
| OpenAPI export | PASS |

---

## 11. Engineering Verdict

**APPROVED WITH MINOR NOTES**

### Minor notes

1. **No automatic backfill** of EventChecklists from historical Task.category groupings — operators generate when ready; progress falls back to Task checklist items until then.
2. **Template item update UI** supports add via Settings; richer inline edit of item fields (duration/role) can follow without API changes.
3. **Staff assignment still uses User UUID** in workspace (P2-01 note) — unrelated to checklists; unchanged.

### Suggested next steps

- P2-03 — Staff Scheduling & Availability  
- P2-04 — Vendor Procurement Workflow  
- P2-05 — Inventory Operations Enhancements  
- P2-06 — Finance Documents & Attachments  
- P2-07 — WhatsApp & Notification Automation  
- P2-08 — Calendar & Scheduling  
- P2-09 — Customer Timeline  
- P2-10 — Advanced Reports & Analytics  
