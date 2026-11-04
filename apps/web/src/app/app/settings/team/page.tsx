'use client';

import { ModulePlaceholderPage } from '@/shared/components/page/module-placeholder-page';

export default function SettingsTeamPage() {
  return (
    <ModulePlaceholderPage
      title="Team"
      description="Team administration placeholder under Settings."
      permission="settings:read"
    />
  );
}
