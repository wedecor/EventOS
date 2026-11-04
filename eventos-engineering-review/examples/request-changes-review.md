# Example: Request Changes Review

## Review: Quotation Controller — PATCH and Send endpoints

### Files Changed

| File | Layer | Action |
|------|-------|--------|
| `apps/api/src/modules/quotation/presentation/quotation.controller.ts` | Presentation | Created |
| `apps/api/src/modules/quotation/presentation/schemas/quotation.schemas.ts` | Presentation | Created |

### Findings

**CRITICAL-01**
| Field | Value |
|---|---|
| **Verdict** | FAIL |
| **Severity** | Critical |
| **File** | `quotation.schemas.ts` |
| **Doc Reference** | `docs/09-api-design.md`, Section "POST /quotations — Request Body" |
| **Recommendation** | Add eventType (string), eventDate ({start,end}), venue (string), terms (string) to createQuotationSchema |
| **Business Impact** | UI team building against the documented API will submit fields the server silently ignores — quotations created without event details |
| **Architecture Impact** | API contract breach; frontend and backend diverge from day one |

**HIGH-01**
| Field | Value |
|---|---|
| **Verdict** | FAIL |
| **Severity** | High |
| **File** | `quotation.controller.ts` |
| **Doc Reference** | `docs/10-implementation-specification.md`, Section "Layer Responsibilities — Presentation" |
| **Recommendation** | Route PATCH /quotations/:id through QuotationApplicationService.updateQuotation() instead of calling quotationRepository.update directly |
| **Business Impact** | No business validation on quotation updates — invalid state transitions possible |
| **Architecture Impact** | Controller bypasses application layer, violating Presentation → Application → Domain flow; sets precedent for other controllers |

**HIGH-02**
| Field | Value |
|---|---|
| **Verdict** | FAIL |
| **Severity** | High |
| **File** | `quotation.controller.ts` |
| **Doc Reference** | `docs/09-api-design.md`, Section "POST /quotations/:id/send — Request Body" |
| **Recommendation** | Add sendQuotationSchema with channel and recipient fields per spec. Apply ZodValidationPipe and pass values to service |
| **Business Impact** | Send endpoint ignores channel/recipient — quotation delivery method not captured |
| **Architecture Impact** | Missing validation at API boundary; service receives no delivery context |

### Implementation Confidence Score

**Score: 62/100**

### Compliance Summary

| Area | Status |
|------|--------|
| Architecture | FAIL |
| API Contract | FAIL |
| Domain Model | PASS |
| Data Model | PASS |
| EP1 Traceability | PARTIAL |
| Phase 1 Scope | PASS |
| Tests | PARTIAL |
| DoD | FAIL |

### Documentation Drift

No drift detected — the code is incorrect in all three findings. The documentation accurately
reflects the intended behavior.

### Review Statistics

| Metric | Value |
|--------|-------|
| Files Reviewed | 2 |
| Files Changed | 2 |
| Critical Findings | 1 |
| High Findings | 2 |
| Medium Findings | 0 |
| Low Findings | 0 |
| PASS Checks | 5 |
| Compliance Score | 62 |

### EP1 Coverage Summary

| Requirement ID | Status | Implementing Files | Covering Tests |
|---|---|---|---|
| EP1-FIN-001 | Partial | `quotation.controller.ts` | None |

### Final Verdict

**HOLD** — Score 62. One Critical (missing API contract fields) and two High findings
(layer violation, missing send validation). The Critical issue means any UI integration
built against the documented API spec will fail. Resolve all three before merge.
