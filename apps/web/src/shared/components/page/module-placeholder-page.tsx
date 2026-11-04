'use client';

import { usePathname } from 'next/navigation';
import type { Permission } from '@/shared/auth/rbac';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import {
  ContentCard,
  EmptyState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';

type ModulePlaceholderPageProps = {
  title: string;
  description: string;
  /** Gate the placeholder with a backend permission (optional). */
  permission?: Permission;
  anyOf?: readonly Permission[];
};

/**
 * Shared placeholder for F1-03 module routes — no business logic.
 */
export function ModulePlaceholderPage({
  title,
  description,
  permission,
  anyOf,
}: ModulePlaceholderPageProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname ?? '/app/');

  const body = (
    <PageLayout>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={<Breadcrumbs items={crumbs} />}
      />
      <PageSection>
        <ContentCard title="Coming in a later milestone">
          <EmptyState
            title={`${title} module placeholder`}
            description="Navigation and layout are ready. Business functionality will be implemented against the frozen OpenAPI contract in a dedicated milestone."
          />
        </ContentCard>
      </PageSection>
    </PageLayout>
  );

  if (permission || (anyOf && anyOf.length > 0)) {
    return (
      <RequirePermission permission={permission} anyOf={anyOf}>
        {body}
      </RequirePermission>
    );
  }

  return body;
}
