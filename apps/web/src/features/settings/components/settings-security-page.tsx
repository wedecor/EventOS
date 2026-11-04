'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { ChangePasswordForm } from './change-password-form';

/** Authenticated-only (JWT). No settings:* permission — matches OpenAPI. */
export function SettingsSecurityPage() {
  const pathname = usePathname() ?? '/app/settings/security/';
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'Security' });

  return (
    <PageLayout>
      <PageHeader
        title="Security"
        description="Account password change. Does not require settings:read."
        breadcrumbs={<Breadcrumbs items={crumbs} />}
        actions={
          <Can permission="settings:read">
            <Button asChild variant="outline" size="sm">
              <Link href="/app/settings/">Tenant settings</Link>
            </Button>
          </Can>
        }
      />
      <PageSection>
        <ChangePasswordForm />
      </PageSection>
    </PageLayout>
  );
}
