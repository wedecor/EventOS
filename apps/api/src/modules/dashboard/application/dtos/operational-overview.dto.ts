import type { MoneyDto } from '../../../finance/application/dtos/profitability.dto';

// EP1-AUT-006, EP1-OPS-001, EP1-OPS-004, EP1-FIN-003, EP1-VEN-005 — Operational overview:
// composite at-risk / attention-needed indicators (I1, I3) aggregated from other dashboard
// summaries. Read-only; does not duplicate the underlying business logic that computes each
// indicator (delegates to the same repository reads used by the dedicated summaries).
export type OperationalOverviewDto = {
  upcomingEventsCount: number;
  needsAttentionEventsCount: number;
  pendingPaymentsCount: number;
  pendingPaymentsAmount: MoneyDto;
  costVarianceFlaggedCount: number;
  unconfirmedStaffForUpcomingEvents: number;
};
