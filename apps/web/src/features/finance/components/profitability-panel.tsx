'use client';

import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import {
  ContentCard,
  ErrorState,
  LoadingState,
} from '@/shared/components/page';
import { useBookingProfitabilityQuery } from '../hooks/use-finance-queries';
import { formatMoney } from '../lib/format';

type ProfitabilityPanelProps = {
  bookingId: string;
};

export function ProfitabilityPanel({ bookingId }: ProfitabilityPanelProps) {
  const query = useBookingProfitabilityQuery(bookingId);

  return (
    <Can permission="profitability:read">
      <ContentCard
        title="Profitability"
        description="GET /bookings/:id/profitability — revenue − vendor expenses (derived)."
      >
        {query.isLoading ? <LoadingState variant="skeleton" rows={2} /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load profitability"
            description={
              query.error instanceof ApiError
                ? query.error.message
                : 'Request failed.'
            }
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {query.data ? (
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Revenue
              </dt>
              <dd className="text-lg font-semibold">
                {formatMoney(
                  query.data.revenue.amount,
                  query.data.revenue.currency,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Vendor expenses
              </dt>
              <dd className="text-lg font-semibold">
                {formatMoney(
                  query.data.vendorExpenses.amount,
                  query.data.vendorExpenses.currency,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Gross margin
              </dt>
              <dd className="text-lg font-semibold">
                {formatMoney(
                  query.data.grossMargin.amount,
                  query.data.grossMargin.currency,
                )}
              </dd>
            </div>
          </dl>
        ) : null}
      </ContentCard>
    </Can>
  );
}
