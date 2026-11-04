'use client';

import { usePathname, useRouter } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import {
  ContentCard,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { StaffForm } from './staff-form';
import { useCreateStaffMutation } from '../hooks/use-staff-queries';
import {
  toCreateStaffRequest,
  type StaffFormValues,
} from '../schemas/staff.schemas';

export function CreateStaffPage() {
  const pathname = usePathname() ?? '/app/staff/new/';
  const router = useRouter();
  const createMutation = useCreateStaffMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New staff' });

  const onSubmit = async (values: StaffFormValues) => {
    try {
      const member = await createMutation.mutateAsync(
        toCreateStaffRequest(values),
      );
      toast.success('Staff member created');
      router.replace(`/app/staff/view/?id=${encodeURIComponent(member.id)}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to create staff member.',
      );
    }
  };

  return (
    <RequirePermission permission="staff:write">
      <PageLayout>
        <PageHeader
          title="New staff"
          description="Creates a staff member via POST /api/v1/staff."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Profile">
            <StaffForm submitLabel="Create staff" onSubmit={onSubmit} />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
