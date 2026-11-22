'use client';

import { RequirePermission } from '@/features/auth';
import { IntegrationSettingsForm } from '@/features/settings/components/integration-settings-form';
import {
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';

export default function SettingsIntegrationsPage() {
  return (
    <RequirePermission permission="settings:read">
      <PageLayout>
        <PageHeader
          title="Integrations"
          description="Configure email and document storage. Secrets are write-only and never returned by the API."
        />
        <PageSection>
          <IntegrationSettingsForm />
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
