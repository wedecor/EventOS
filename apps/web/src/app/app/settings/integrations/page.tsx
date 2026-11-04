'use client';

import { ModulePlaceholderPage } from '@/shared/components/page/module-placeholder-page';

export default function SettingsIntegrationsPage() {
  return (
    <ModulePlaceholderPage
      title="Integrations"
      description="Integrations placeholder under Settings."
      permission="settings:read"
    />
  );
}
