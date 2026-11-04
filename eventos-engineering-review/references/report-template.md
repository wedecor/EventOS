# Review Report Template

Use this template structure for every review report.

---

## 1. Files Changed

| File | Layer | Action |
|------|-------|--------|
| `path/to/file.ts` | Presentation / Application / Domain / Infrastructure / Test / Config | Created / Modified |

## 2. Findings

Never report an issue unless you can point to all three of these:

1. **The exact file** where the problem exists
2. **The exact documentation section** that the code violates or fails to satisfy
3. **The exact reason** — what specifically is wrong and why it matters

If you cannot cite a specific doc section, the issue is speculative and must not be reported.

### Finding format

| Field | Description |
|---|---|
| **Verdict** | PASS or FAIL |
| **Severity** | Critical / High / Medium / Low |
| **File** | Exact file path |
| **Doc Reference** | Exact document and section that defines the expected behavior |
| **Recommendation** | What to change and how |
| **Business Impact** | What breaks for the business if this ships as-is |
| **Architecture Impact** | What technical debt or structural damage this causes |

Group findings by severity (Critical first, then High, Medium, Low).

## 3. Implementation Confidence Score

| Score | Meaning | Action |
|---|---|---|
| 95–100 | Ready to merge | No blocking issues. Ship it. |
| 85–94 | Minor improvements only | Small fixes needed, nothing structural. |
| 70–84 | Needs changes before merge | Significant issues that must be resolved first. |
| Below 70 | Major architectural issues | Fundamental problems — do not merge. |

**Score: XX/100**

## 4. Compliance Summary

| Area | Status |
|------|--------|
| Architecture | PASS / PARTIAL / FAIL |
| API Contract | PASS / PARTIAL / FAIL |
| Domain Model | PASS / PARTIAL / FAIL |
| Data Model | PASS / PARTIAL / FAIL |
| EP1 Traceability | PASS / PARTIAL / FAIL |
| Phase 1 Scope | PASS / PARTIAL / FAIL |
| Tests | PASS / PARTIAL / FAIL |
| DoD | PASS / PARTIAL / FAIL |

## 5. Documentation Drift

| File | Document | Section | Classification | Notes |
|------|----------|---------|----------------|-------|

Classifications: Code is incorrect / Documentation is incorrect / Both require updates

## 6. Review Statistics

| Metric | Value |
|--------|-------|
| Files Reviewed | |
| Files Changed | |
| Critical Findings | |
| High Findings | |
| Medium Findings | |
| Low Findings | |
| PASS Checks | |
| Compliance Score | |

## 7. EP1 Coverage Summary

Only requirements affected by the files under review. Do not reproduce the full EP1 catalog.

| Requirement ID | Status | Implementing Files | Covering Tests |
|---|---|---|---|

UNTRACED IMPLEMENTATION (if any):
- `<file path>`: `<description>`

## 8. Final Verdict

**APPROVE** / **REQUEST CHANGES** / **HOLD**

(Justification)
