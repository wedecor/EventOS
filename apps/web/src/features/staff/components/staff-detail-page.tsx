'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useStaffMemberQuery } from '../hooks/use-staff-queries';
import { formatEmploymentType, formatStaffStatus, formatStaffWhen } from '../lib/format';
import { StaffSchedulingPanel } from '@/features/staff-scheduling';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

export function StaffDetailPage() {
  const pathname = usePathname() ?? '/app/staff/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useStaffMemberQuery(id);
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data?.name ?? 'Staff',
  });

  return (
    <RequirePermission permission="staff:read">
      <PageLayout>
        <PageHeader
          title={query.data?.name ?? 'Staff'}
          description="Staff profile from GET /api/v1/staff/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {id ? (
                <Can permission="staff:write">
                  <Button asChild variant="outline">
                    <Link href={`/app/staff/edit/?id=${encodeURIComponent(id)}`}>
                      Edit
                    </Link>
                  </Button>
                </Can>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/staff/">Back to list</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing staff id"
              description="Open a staff member with ?id=<uuid>."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={5} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load staff"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          </PageSection>
        ) : null}

        {id && query.data ? (
          <PageSection>
            <ContentCard title="Profile">
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Name" value={query.data.name} />
                <DetailField
                  label="Operational role"
                  value={query.data.operationalRole ?? query.data.role}
                />
                <DetailField
                  label="Employment type"
                  value={formatEmploymentType(query.data.employmentType)}
                />
                <DetailField
                  label="Status"
                  value={formatStaffStatus(query.data.status)}
                />
                <DetailField
                  label="Active"
                  value={
                    (query.data.active ?? query.data.status === 'active')
                      ? 'Yes'
                      : 'No'
                  }
                />
                <DetailField
                  label="Department"
                  value={query.data.department ?? '—'}
                />
                <DetailField label="Phone" value={query.data.phone} />
                <DetailField label="Email" value={query.data.email ?? '—'} />
                <DetailField
                  label="Linked user"
                  value={query.data.userId ?? '—'}
                />
                <DetailField
                  label="Joined"
                  value={
                    query.data.joinedAt
                      ? formatStaffWhen(query.data.joinedAt)
                      : '—'
                  }
                />
                <DetailField
                  label="Version"
                  value={String(query.data.version)}
                />
                <DetailField
                  label="Created"
                  value={formatStaffWhen(query.data.createdAt)}
                />
                <DetailField
                  label="Updated"
                  value={formatStaffWhen(query.data.updatedAt)}
                />
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Assignments are booking-scoped (`GET /staff-assignments?bookingId=`).
                Availability, leave, and workload live on this StaffMember.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/staff/scheduling/">Open scheduling calendar</Link>
                </Button>
              </div>
            </ContentCard>
          </PageSection>
        ) : null}

        {id && query.data ? (
          <PageSection>
            <StaffSchedulingPanel staffMemberId={id} />
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
