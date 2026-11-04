'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { TenantSettingsForm } from './tenant-settings-form';

export function SettingsGeneralPage() {
  const pathname = usePathname() ?? '/app/settings/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="settings:read">
      <PageLayout>
        <PageHeader
          title="Settings"
          description="Tenant configuration from frozen /api/v1/settings. Team, templates, and integrations remain deferred."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/app/settings/security/">Security</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/staff/">Staff master</Link>
            </Button>
          </div>
        }
        />
        <PageSection>
          <TenantSettingsForm />
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
