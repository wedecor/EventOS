# Implementation Report Template

Produce this report after every implementation. It provides traceability from requirements
to code to tests.

---

## 1. Request Summary

| Field | Value |
|-------|-------|
| **Feature** | Short description of what was implemented |
| **Requested by** | User |
| **EP1 Requirements** | Comma-separated EP1 IDs addressed |
| **Scope** | What was in scope |
| **Explicitly out of scope** | What was not implemented and why |

## 2. Documentation Consulted

List every document read during implementation, with the specific sections referenced:

| Document | Sections | Used for |
|----------|----------|----------|
| `docs/business/19-event-os-phase1-requirements.md` | Section X | EP1 requirement definition |
| `docs/09-api-design.md` | Section Y | Endpoint contract |
| ... | ... | ... |

## 3. Files Changed

| File | Layer | Action | EP1 Requirement |
|------|-------|--------|-----------------|
| `path/to/file.ts` | Presentation / Application / Domain / Infrastructure / Test / Config | Created / Modified | EP1-XXX-NNN |

## 4. Implementation Decisions

Document any decisions made during implementation that were not fully specified by the docs.
For each decision:

| Decision | Alternatives considered | Why this choice | Doc gap? |
|----------|------------------------|-----------------|----------|

If a decision was forced by a documentation gap, mark `Doc gap?` as Yes and note it in
Section 8 (Documentation Synchronization).

## 5. Self-Review Results

Run the implementation checklist (`references/implementation-checklist.md`) and report results:

| Area | Result |
|------|--------|
| EP1 Traceability | PASS / FAIL |
| Architecture Compliance | PASS / FAIL |
| API Contract | PASS / FAIL |
| Data Model | PASS / FAIL |
| ADR Compliance | PASS / FAIL |
| Layer Responsibilities | PASS / FAIL |
| Code Patterns | PASS / FAIL |
| Tests | PASS / FAIL |
| General Quality | PASS / FAIL |
| Module Wiring | PASS / FAIL |

If any area is FAIL, explain what's missing and why (e.g., spec is ambiguous, blocked by
another task, requires user decision).

## 6. Test Summary

| Metric | Value |
|--------|-------|
| Test files created | (count) |
| Test files modified | (count) |
| Test cases added | (count) |
| Happy path tests | (count) |
| Error path tests | (count) |
| Event publication tests | (count) |

## 7. EP1 Coverage

Only requirements addressed by this implementation:

| Requirement ID | Status | Implementing Files | Covering Tests |
|---|---|---|---|
| EP1-XXX-NNN | Implemented / Partial | file paths | test file paths |

## 8. Documentation Synchronization

If the implementation revealed documentation gaps or conflicts:

| Document | Section | Issue | Recommended action |
|----------|---------|-------|--------------------|

If no documentation issues were found, state: "No documentation synchronization required."

## 9. Known Limitations

List anything the implementation does not cover that the user should be aware of:

- Limitation 1 — reason and what would be needed to address it
- ...

If no limitations, state: "Implementation fully satisfies the requested scope."
