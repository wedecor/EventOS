'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
import { useBookingQuery } from '@/features/bookings';
import { useCustomerQuery } from '@/features/customers/hooks/use-customer-queries';
import {
  useBookingPaymentsQuery,
  useBookingProfitabilityQuery,
} from '@/features/finance/hooks/use-finance-queries';
import { formatMoney, formatWhen } from '@/features/finance/lib/format';
import { PaymentsPanel } from '@/features/finance/components/payments-panel';
import { ProfitabilityPanel } from '@/features/finance/components/profitability-panel';
import { CommunicationsSummaryCard } from '@/features/communications';
import { CalendarSummaryCard } from '@/features/calendar';
import { useBookingMovementsQuery } from '@/features/inventory/hooks/use-inventory-queries';
import {
  STAFF_ROLE_PRESETS,
  useCancelStaffAssignmentMutation,
  useConfirmStaffAssignmentMutation,
  useCreateStaffAssignmentMutation,
  useReleaseStaffAssignmentMutation,
  useStaffAssignmentsByBookingQuery,
} from '@/features/staff-assignments';
import { useStaffListQuery } from '@/features/staff';
import {
  formatEmploymentType,
} from '@/features/staff/lib/format';
import {
  useStaffConflictsQuery,
  useStaffRecommendationsQuery,
  useStaffWorkloadQuery,
} from '@/features/staff-scheduling';
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  useAddChecklistItemMutation,
  useCreateTaskMutation,
  useTasksByBookingQuery,
  useUpdateChecklistItemMutation,
  useUpdateTaskStatusMutation,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
} from '@/features/tasks';
import {
  useEventChecklistsByBookingQuery,
  useGenerateEventChecklistsMutation,
  useUpdateEventChecklistItemMutation,
} from '@/features/checklists';
import {
  useBookingProcurementsQuery,
  useCreateProcurementMutation,
  useVendorsQuery,
} from '@/features/vendors';
import { formatWorkflowStatus } from '@/features/vendors/schemas/procurement.schemas';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
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
import {
  useActivateWorkspaceMutation,
  useCreateWorkspaceNoteMutation,
  useDeleteWorkspaceNoteMutation,
  useWorkspaceActivityQuery,
  useWorkspaceNotesQuery,
  useWorkspaceProgressQuery,
  useWorkspaceQuery,
} from '../hooks/use-workspace-queries';
import { formatWorkspaceLabel } from '../lib/format';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Overall completion</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Event Workspace — operational command center (P2-01).
 * Thin workspace DTO + sibling booking-scoped APIs composed in the UI.
 */
export function EventWorkspacePage() {
  const pathname = usePathname() ?? '/app/events/workspace/';
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const workspaceQuery = useWorkspaceQuery(bookingId);
  const bookingQuery = useBookingQuery(bookingId);
  const progressQuery = useWorkspaceProgressQuery(bookingId);
  const activityQuery = useWorkspaceActivityQuery(bookingId);
  const notesQuery = useWorkspaceNotesQuery(bookingId);
  const tasksQuery = useTasksByBookingQuery(bookingId);
  const eventChecklistsQuery = useEventChecklistsByBookingQuery(bookingId);
  const staffQuery = useStaffAssignmentsByBookingQuery(bookingId);
  const staffDirectoryQuery = useStaffListQuery({ status: 'active' });
  const staffRecommendationsQuery = useStaffRecommendationsQuery(bookingId);
  const procurementsQuery = useBookingProcurementsQuery(bookingId);
  const movementsQuery = useBookingMovementsQuery(bookingId);
  const paymentsQuery = useBookingPaymentsQuery(bookingId);
  const profitabilityQuery = useBookingProfitabilityQuery(bookingId);
  const vendorsQuery = useVendorsQuery();
  const customerQuery = useCustomerQuery(bookingQuery.data?.customerId);

  const activateMutation = useActivateWorkspaceMutation(bookingId ?? '');
  const createNoteMutation = useCreateWorkspaceNoteMutation(bookingId ?? '');
  const deleteNoteMutation = useDeleteWorkspaceNoteMutation(bookingId ?? '');
  const createTaskMutation = useCreateTaskMutation(bookingId ?? '');
  const updateTaskStatusMutation = useUpdateTaskStatusMutation(bookingId ?? '');
  const addChecklistMutation = useAddChecklistItemMutation(bookingId ?? '');
  const updateChecklistMutation = useUpdateChecklistItemMutation(bookingId ?? '');
  const generateEventChecklistsMutation = useGenerateEventChecklistsMutation(
    bookingId ?? '',
  );
  const updateEventChecklistItemMutation = useUpdateEventChecklistItemMutation(
    bookingId ?? '',
  );
  const createStaffMutation = useCreateStaffAssignmentMutation(bookingId ?? '');
  const confirmStaffMutation = useConfirmStaffAssignmentMutation(bookingId ?? '');
  const releaseStaffMutation = useReleaseStaffAssignmentMutation(bookingId ?? '');
  const cancelStaffMutation = useCancelStaffAssignmentMutation(bookingId ?? '');
  const createProcurementMutation = useCreateProcurementMutation(bookingId ?? '');

  const [activateOpen, setActivateOpen] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('general');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [checklistDrafts, setChecklistDrafts] = useState<Record<string, string>>(
    {},
  );
  const [staffMemberId, setStaffMemberId] = useState('');
  const [staffRole, setStaffRole] = useState<string>(STAFF_ROLE_PRESETS[0]);
  const [vendorId, setVendorId] = useState('');
  const selectedStaffConflictsQuery = useStaffConflictsQuery(
    staffMemberId || null,
    bookingId,
  );
  const selectedStaffWorkloadQuery = useStaffWorkloadQuery(
    staffMemberId || null,
  );

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: bookingQuery.data
      ? `Workspace B-${bookingQuery.data.bookingNumber}`
      : 'Workspace',
  });

  const workspace = workspaceQuery.data;
  const booking = bookingQuery.data;
  const progress = progressQuery.data;
  const canActivate =
    workspace?.workspaceStatus === 'inactive' &&
    booking &&
    (booking.status === 'approved' || booking.status === 'in_preparation');

  const vendorById = useMemo(() => {
    const map = new Map<string, { name: string; contactName: string | null; contactPhone: string | null }>();
    for (const vendor of vendorsQuery.data ?? []) {
      map.set(vendor.id, {
        name: vendor.name,
        contactName: vendor.contactName,
        contactPhone: vendor.contactPhone,
      });
    }
    return map;
  }, [vendorsQuery.data]);

  const checklistGroups = useMemo(() => {
    return eventChecklistsQuery.data ?? [];
  }, [eventChecklistsQuery.data]);

  const paymentsReceived = useMemo(() => {
    return (paymentsQuery.data ?? [])
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [paymentsQuery.data]);

  const paymentCurrency =
    paymentsQuery.data?.[0]?.currency ??
    profitabilityQuery.data?.revenue.currency ??
    'INR';

  const pendingAmount = profitabilityQuery.data
    ? Math.max(0, profitabilityQuery.data.revenue.amount - paymentsReceived)
    : null;

  const onActivate = async () => {
    if (!bookingId || !booking) return;
    try {
      await activateMutation.mutateAsync(booking.version);
      toast.success('Workspace activated');
      setActivateOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to activate workspace.',
      );
    }
  };

  const loading = workspaceQuery.isLoading || bookingQuery.isLoading;
  const error = workspaceQuery.isError
    ? workspaceQuery.error
    : bookingQuery.isError
      ? bookingQuery.error
      : null;

  return (
    <RequirePermission permission="workspace:read">
      <PageLayout>
        <PageHeader
          title={
            booking
              ? `Event workspace · B-${booking.bookingNumber}`
              : 'Event workspace'
          }
          description="Operational command center for event execution — overview, tasks, checklists, staff, vendors, inventory, finance, communications, notes, and activity."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {bookingId ? (
                <>
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/bookings/view/?id=${encodeURIComponent(bookingId)}`}
                    >
                      Booking
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/finance/booking/?id=${encodeURIComponent(bookingId)}`}
                    >
                      Finance
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/inventory/movements/?bookingId=${encodeURIComponent(bookingId)}`}
                    >
                      Inventory
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/communications/?bookingId=${encodeURIComponent(bookingId)}`}
                    >
                      Communications
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/calendar/?bookingId=${encodeURIComponent(bookingId)}`}
                    >
                      Calendar
                    </Link>
                  </Button>
                </>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/events/">Events hub</Link>
              </Button>
            </div>
          }
        />

        {!bookingId ? (
          <PageSection>
            <EmptyState
              title="Missing booking id"
              description="Open a workspace with ?id=<bookingUuid>."
            />
          </PageSection>
        ) : null}

        {bookingId && loading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={6} />
          </PageSection>
        ) : null}

        {bookingId && error ? (
          <PageSection>
            <ErrorState
              title="Unable to load workspace"
              description={
                error instanceof ApiError ? error.message : 'Request failed.'
              }
              onRetry={() => {
                void workspaceQuery.refetch();
                void bookingQuery.refetch();
              }}
            />
          </PageSection>
        ) : null}

        {bookingId && workspace && booking ? (
          <>
            <PageSection>
              <ContentCard title="Event overview">
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Customer"
                    value={
                      customerQuery.data?.displayName ??
                      booking.customerId
                    }
                  />
                  <DetailField
                    label="Event"
                    value={booking.eventType ?? '—'}
                  />
                  <DetailField label="Venue" value={booking.venueName ?? '—'} />
                  <DetailField
                    label="Date & time"
                    value={
                      booking.eventStartDate
                        ? formatWhen(booking.eventStartDate)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Event status"
                    value={formatWorkspaceLabel(booking.status)}
                  />
                  <DetailField
                    label="Workspace status"
                    value={formatWorkspaceLabel(workspace.workspaceStatus)}
                  />
                  <DetailField
                    label="Preparation"
                    value={formatWorkspaceLabel(workspace.preparationStatus)}
                  />
                  <DetailField
                    label="Milestone"
                    value={workspace.operationalMilestone ?? '—'}
                  />
                  <DetailField
                    label="Execution owner"
                    value={workspace.executionOwnerId ?? '—'}
                  />
                  <DetailField
                    label="Assigned team"
                    value={
                      (staffQuery.data ?? []).filter(
                        (a) =>
                          a.status === 'proposed' || a.status === 'confirmed',
                      ).length
                    }
                  />
                  <DetailField
                    label="Assigned vendors"
                    value={(procurementsQuery.data ?? []).length}
                  />
                  <DetailField
                    label="Completion"
                    value={
                      progress
                        ? `${progress.overallCompletionPercent}%`
                        : '—'
                    }
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Activation">
                {workspace.workspaceStatus === 'active' ? (
                  <p className="text-sm text-muted-foreground">
                    Workspace is active. Manage operations in the sections below.
                  </p>
                ) : null}
                {workspace.workspaceStatus === 'archived' ? (
                  <p className="text-sm text-muted-foreground">
                    Workspace is archived (typically after cancel or complete).
                  </p>
                ) : null}
                {workspace.workspaceStatus === 'inactive' && !canActivate ? (
                  <p className="text-sm text-muted-foreground">
                    Workspace can only be activated when the booking is approved
                    or in preparation. Current booking status:{' '}
                    {formatWorkspaceLabel(booking.status)}.
                  </p>
                ) : null}
                {canActivate ? (
                  <Can permission="workspace:activate">
                    <Button
                      type="button"
                      disabled={activateMutation.isPending}
                      onClick={() => setActivateOpen(true)}
                    >
                      Activate workspace
                    </Button>
                  </Can>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Progress tracking">
                {progressQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={2} />
                ) : null}
                {progressQuery.isError ? (
                  <ErrorState
                    title="Unable to load progress"
                    description={
                      progressQuery.error instanceof ApiError
                        ? progressQuery.error.message
                        : 'Request failed.'
                    }
                    onRetry={() => void progressQuery.refetch()}
                  />
                ) : null}
                {progress ? (
                  <div className="space-y-4">
                    <ProgressBar percent={progress.overallCompletionPercent} />
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <DetailField
                        label="Tasks complete"
                        value={`${progress.tasksComplete} / ${progress.tasksTotal}`}
                      />
                      <DetailField
                        label="Checklist completion"
                        value={`${progress.checklistComplete} / ${progress.checklistTotal}`}
                      />
                      <DetailField
                        label="Pending actions"
                        value={progress.pendingActions}
                      />
                      <DetailField
                        label="Inventory reserved"
                        value={progress.inventory.reserved}
                      />
                    </dl>
                  </div>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Operational tasks">
                <Can permission="tasks:write">
                  <form
                    className="mb-4 grid gap-2 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!taskTitle.trim()) return;
                      void createTaskMutation
                        .mutateAsync({
                          title: taskTitle.trim(),
                          category: taskCategory,
                          priority: taskPriority,
                        })
                        .then(() => {
                          toast.success('Task created');
                          setTaskTitle('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to create task.',
                          ),
                        );
                    }}
                  >
                    <Input
                      placeholder="Task title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                    <select
                      className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                      value={taskCategory}
                      onChange={(e) =>
                        setTaskCategory(e.target.value as TaskCategory)
                      }
                    >
                      {TASK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {formatWorkspaceLabel(c)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                      value={taskPriority}
                      onChange={(e) =>
                        setTaskPriority(e.target.value as TaskPriority)
                      }
                    >
                      {TASK_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {formatWorkspaceLabel(p)}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      disabled={createTaskMutation.isPending}
                    >
                      Add task
                    </Button>
                  </form>
                </Can>
                {tasksQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={3} />
                ) : null}
                {(tasksQuery.data ?? []).length === 0 && !tasksQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                ) : null}
                <ul className="space-y-3">
                  {(tasksQuery.data ?? []).map((task) => (
                    <li
                      key={task.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatWorkspaceLabel(task.category)} ·{' '}
                            {formatWorkspaceLabel(task.priority)} ·{' '}
                            {formatWorkspaceLabel(task.status)}
                          </p>
                          {task.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          ) : null}
                          {task.completionNotes ? (
                            <p className="mt-1 text-sm">
                              Completion notes: {task.completionNotes}
                            </p>
                          ) : null}
                        </div>
                        <Can permission="tasks:status:update">
                          <div className="flex flex-wrap gap-1">
                            {task.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  void updateTaskStatusMutation
                                    .mutateAsync({
                                      id: task.id,
                                      body: { status: 'in_progress' },
                                      version: task.version,
                                    })
                                    .then(() =>
                                      toast.success('Task in progress'),
                                    )
                                    .catch((err) =>
                                      toast.error(
                                        err instanceof ApiError
                                          ? err.message
                                          : 'Unable to update task.',
                                      ),
                                    )
                                }
                              >
                                Start
                              </Button>
                            ) : null}
                            {task.status === 'in_progress' ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  const notes =
                                    window.prompt(
                                      'Completion notes (optional)',
                                    ) ?? undefined;
                                  void updateTaskStatusMutation
                                    .mutateAsync({
                                      id: task.id,
                                      body: {
                                        status: 'completed' satisfies TaskStatus,
                                        completionNotes: notes || undefined,
                                      },
                                      version: task.version,
                                    })
                                    .then(() => toast.success('Task completed'))
                                    .catch((err) =>
                                      toast.error(
                                        err instanceof ApiError
                                          ? err.message
                                          : 'Unable to complete task.',
                                      ),
                                    );
                                }}
                              >
                                Complete
                              </Button>
                            ) : null}
                          </div>
                        </Can>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {task.checklistItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Can permission="tasks:write">
                              <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={(e) =>
                                  void updateChecklistMutation
                                    .mutateAsync({
                                      taskId: task.id,
                                      itemId: item.id,
                                      body: {
                                        isCompleted: e.target.checked,
                                      },
                                      version: item.version,
                                    })
                                    .catch((err) =>
                                      toast.error(
                                        err instanceof ApiError
                                          ? err.message
                                          : 'Unable to update checklist item.',
                                      ),
                                    )
                                }
                              />
                            </Can>
                            <span
                              className={
                                item.isCompleted
                                  ? 'text-muted-foreground line-through'
                                  : undefined
                              }
                            >
                              {item.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Can permission="tasks:write">
                        <form
                          className="mt-2 flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const description =
                              checklistDrafts[task.id]?.trim();
                            if (!description) return;
                            void addChecklistMutation
                              .mutateAsync({
                                taskId: task.id,
                                body: { description },
                              })
                              .then(() => {
                                setChecklistDrafts((prev) => ({
                                  ...prev,
                                  [task.id]: '',
                                }));
                                toast.success('Checklist item added');
                              })
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError
                                    ? err.message
                                    : 'Unable to add checklist item.',
                                ),
                              );
                          }}
                        >
                          <Input
                            placeholder="Add checklist item"
                            value={checklistDrafts[task.id] ?? ''}
                            onChange={(e) =>
                              setChecklistDrafts((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Add
                          </Button>
                        </form>
                      </Can>
                    </li>
                  ))}
                </ul>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Event checklists">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Can permission="checklists:write">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={generateEventChecklistsMutation.isPending}
                      onClick={() => {
                        void generateEventChecklistsMutation
                          .mutateAsync(undefined)
                          .then((list) =>
                            toast.success(
                              list.length > 0
                                ? `Generated ${list.length} checklist(s)`
                                : 'No matching active templates',
                            ),
                          )
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Unable to generate checklists.',
                            ),
                          );
                      }}
                    >
                      Generate from templates
                    </Button>
                  </Can>
                </div>

                {eventChecklistsQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={3} />
                ) : null}
                {eventChecklistsQuery.isError ? (
                  <ErrorState
                    title="Unable to load event checklists"
                    description="Event checklists could not be loaded."
                    onRetry={() => void eventChecklistsQuery.refetch()}
                  />
                ) : null}

                {checklistGroups.map((checklist) => {
                  const done = checklist.items.filter((i) => i.isCompleted)
                    .length;
                  return (
                    <div key={checklist.id} className="mb-4 last:mb-0">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-sm font-medium">{checklist.name}</h3>
                        <Badge>
                          {done}/{checklist.items.length}
                        </Badge>
                        <Badge>
                          {formatWorkspaceLabel(checklist.category)}
                        </Badge>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {checklist.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex flex-wrap items-start gap-2 border-b border-border/50 pb-2 last:border-0"
                          >
                            <Can
                              permission="checklists:execute"
                              fallback={
                                <span>
                                  {item.isCompleted ? '✓' : '○'} {item.title}
                                </span>
                              }
                            >
                              <label className="flex flex-1 items-start gap-2">
                                <input
                                  type="checkbox"
                                  className="mt-1"
                                  checked={item.isCompleted}
                                  disabled={
                                    updateEventChecklistItemMutation.isPending
                                  }
                                  onChange={(e) => {
                                    void updateEventChecklistItemMutation
                                      .mutateAsync({
                                        checklistId: checklist.id,
                                        itemId: item.id,
                                        body: {
                                          isCompleted: e.target.checked,
                                        },
                                        version: item.version,
                                      })
                                      .catch((err) =>
                                        toast.error(
                                          err instanceof ApiError
                                            ? err.message
                                            : 'Unable to update checklist item.',
                                        ),
                                      );
                                  }}
                                />
                                <span>
                                  <span className="font-medium">
                                    {item.title}
                                  </span>
                                  {item.description ? (
                                    <span className="block text-muted-foreground">
                                      {item.description}
                                    </span>
                                  ) : null}
                                  {item.completedAt ? (
                                    <span className="block text-xs text-muted-foreground">
                                      Completed {formatWhen(item.completedAt)}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            </Can>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {!eventChecklistsQuery.isLoading &&
                !eventChecklistsQuery.isError &&
                checklistGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No event checklists yet. Generate from active templates, or
                    accept a checklist.generate suggestion. Task checklist items
                    remain available under Tasks for P2-01 compatibility.
                  </p>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Staff assignment">
                <Can permission="staff:write">
                  <form
                    className="mb-4 grid gap-2 sm:grid-cols-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!staffMemberId.trim()) return;
                      const conflicts =
                        selectedStaffConflictsQuery.data ?? [];
                      if (conflicts.length > 0) {
                        toast.message(
                          `Warning: ${conflicts.length} scheduling conflict(s). Confirm will be blocked until resolved.`,
                        );
                      }
                      void createStaffMutation
                        .mutateAsync({
                          staffMemberId: staffMemberId.trim(),
                          role: staffRole,
                        })
                        .then(() => {
                          toast.success('Staff assignment proposed');
                          setStaffMemberId('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to assign staff.',
                          ),
                        );
                    }}
                  >
                    <select
                      className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                      value={staffMemberId}
                      onChange={(e) => setStaffMemberId(e.target.value)}
                    >
                      <option value="">Select staff member</option>
                      {(staffDirectoryQuery.data ?? []).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} · {member.role} ·{' '}
                          {formatEmploymentType(member.employmentType)}
                        </option>
                      ))}
                    </select>
                    <select
                      className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                    >
                      {STAFF_ROLE_PRESETS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      disabled={
                        createStaffMutation.isPending || !staffMemberId.trim()
                      }
                    >
                      Assign staff
                    </Button>
                  </form>
                </Can>

                {staffMemberId ? (
                  <div className="mb-4 space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
                    {(selectedStaffConflictsQuery.data ?? []).length > 0 ? (
                      <div>
                        <p className="font-medium text-destructive">
                          Conflict warnings
                        </p>
                        <ul className="mt-1 list-disc pl-4 text-xs text-destructive">
                          {(selectedStaffConflictsQuery.data ?? []).map(
                            (c, i) => (
                              <li key={`${c.code}-${i}`}>{c.message}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No scheduling conflicts detected for this booking.
                      </p>
                    )}
                    {selectedStaffWorkloadQuery.data?.[0] ? (
                      <p className="text-xs text-muted-foreground">
                        Workload: {selectedStaffWorkloadQuery.data[0].eventsToday}{' '}
                        today ·{' '}
                        {selectedStaffWorkloadQuery.data[0].eventsThisWeek} this
                        week ·{' '}
                        {
                          selectedStaffWorkloadQuery.data[0]
                            .upcomingConfirmed
                        }{' '}
                        upcoming
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {(staffRecommendationsQuery.data ?? []).length > 0 ? (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Suggested staff (rule-based)
                    </p>
                    <ul className="space-y-1">
                      {(staffRecommendationsQuery.data ?? [])
                        .slice(0, 5)
                        .map((rec) => (
                          <li key={rec.staffMemberId}>
                            <button
                              type="button"
                              className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
                              onClick={() => setStaffMemberId(rec.staffMemberId)}
                            >
                              <span className="font-medium">{rec.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {' '}
                                · score {rec.score} ·{' '}
                                {rec.conflicts.length > 0
                                  ? `${rec.conflicts.length} conflict(s)`
                                  : 'available'}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}

                <ul className="space-y-2">
                  {(staffQuery.data ?? []).map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {assignment.staffMember?.name ??
                            assignment.staffMemberId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.role ??
                            assignment.staffMember?.operationalRole ??
                            'Unassigned role'}
                          {assignment.staffMember
                            ? ` · ${formatEmploymentType(assignment.staffMember.employmentType)}`
                            : ''}
                          {' · '}
                          {formatWorkspaceLabel(assignment.status)}
                        </p>
                      </div>
                      <Can permission="staff:write">
                        <div className="flex flex-wrap gap-1">
                          {assignment.status === 'proposed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void confirmStaffMutation
                                  .mutateAsync({
                                    id: assignment.id,
                                    version: assignment.version,
                                  })
                                  .then(() => toast.success('Confirmed'))
                                  .catch((err) =>
                                    toast.error(
                                      err instanceof ApiError
                                        ? err.message
                                        : 'Unable to confirm.',
                                    ),
                                  )
                              }
                            >
                              Confirm
                            </Button>
                          ) : null}
                          {assignment.status === 'confirmed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void releaseStaffMutation
                                  .mutateAsync({
                                    id: assignment.id,
                                    version: assignment.version,
                                  })
                                  .then(() => toast.success('Released'))
                                  .catch((err) =>
                                    toast.error(
                                      err instanceof ApiError
                                        ? err.message
                                        : 'Unable to release.',
                                    ),
                                  )
                              }
                            >
                              Release
                            </Button>
                          ) : null}
                          {assignment.status === 'proposed' ||
                          assignment.status === 'confirmed' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason =
                                  window.prompt('Cancellation reason') ?? '';
                                if (!reason.trim()) return;
                                void cancelStaffMutation
                                  .mutateAsync({
                                    id: assignment.id,
                                    reason: reason.trim(),
                                    version: assignment.version,
                                  })
                                  .then(() => toast.success('Cancelled'))
                                  .catch((err) =>
                                    toast.error(
                                      err instanceof ApiError
                                        ? err.message
                                        : 'Unable to cancel.',
                                    ),
                                  );
                              }}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </Can>
                    </li>
                  ))}
                </ul>
                {(staffQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No staff assigned yet. Select an active StaffMember from
                    the directory, or pick a suggestion above.
                  </p>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Vendor procurement">
                <Can permission="procurements:write">
                  <form
                    className="mb-4 flex flex-wrap gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!vendorId) return;
                      void createProcurementMutation
                        .mutateAsync({ vendorId })
                        .then(() => {
                          toast.success('Vendor linked');
                          setVendorId('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to link vendor.',
                          ),
                        );
                    }}
                  >
                    <select
                      className="flex h-9 min-w-[12rem] flex-1 rounded-md border border-input bg-card px-3 text-sm"
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                    >
                      <option value="">Select vendor</option>
                      {(vendorsQuery.data ?? []).map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="submit"
                      disabled={createProcurementMutation.isPending}
                    >
                      Link vendor
                    </Button>
                  </form>
                </Can>
                <ul className="space-y-2">
                  {(procurementsQuery.data ?? []).map((procurement) => {
                    const vendor = vendorById.get(procurement.vendorId);
                    const service =
                      procurement.serviceCategory ??
                      procurement.lines[0]?.description ??
                      procurement.notes ??
                      '—';
                    return (
                      <li
                        key={procurement.id}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <DetailField
                            label="Vendor"
                            value={vendor?.name ?? procurement.vendorId}
                          />
                          <DetailField label="Service" value={service} />
                          <DetailField
                            label="Workflow"
                            value={formatWorkflowStatus(
                              procurement.workflowStatus,
                            )}
                          />
                          <DetailField
                            label="Delivery"
                            value={procurement.deliveryStatus}
                          />
                          <DetailField
                            label="Cost"
                            value={
                              procurement.costSummary
                                ? `Est ${procurement.costSummary.estimatedCost ?? '—'} / App ${procurement.costSummary.approvedCost ?? '—'} / Act ${procurement.costSummary.actualCost ?? '—'}`
                                : '—'
                            }
                          />
                          <DetailField
                            label="Actions"
                            value={
                              (procurement.outstandingActions ?? []).length > 0
                                ? procurement.outstandingActions.join('; ')
                                : 'None'
                            }
                          />
                        </dl>
                        <div className="mt-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/app/vendors/procurements/view/?id=${encodeURIComponent(procurement.id)}`}
                            >
                              Open procurement
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {(procurementsQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No vendors linked yet.
                  </p>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Inventory summary">
                {progress ? (
                  <dl className="mb-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <DetailField
                      label="Reserved"
                      value={progress.inventory.reserved}
                    />
                    <DetailField
                      label="Packed"
                      value={progress.inventory.packed}
                    />
                    <DetailField
                      label="Loaded"
                      value={progress.inventory.loaded}
                    />
                    <DetailField
                      label="Returned"
                      value={progress.inventory.returned}
                    />
                    <DetailField
                      label="Damaged"
                      value={progress.inventory.damaged}
                    />
                    <DetailField
                      label="Outstanding"
                      value={progress.inventory.outstandingActions ?? 0}
                    />
                  </dl>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  {(movementsQuery.data ?? []).length} movement
                  {(movementsQuery.data ?? []).length === 1 ? '' : 's'} for this
                  booking.{' '}
                  <Link
                    className="underline"
                    href={`/app/inventory/movements/?bookingId=${encodeURIComponent(bookingId)}`}
                  >
                    Open inventory movements
                  </Link>
                  {' · '}
                  <Link className="underline" href="/app/inventory/operations/">
                    Operations dashboard
                  </Link>
                </p>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Financial summary">
                <dl className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <DetailField
                    label="Total quote"
                    value={
                      profitabilityQuery.data
                        ? formatMoney(
                            profitabilityQuery.data.revenue.amount,
                            profitabilityQuery.data.revenue.currency,
                          )
                        : '—'
                    }
                  />
                  <DetailField
                    label="Payments received"
                    value={formatMoney(paymentsReceived, paymentCurrency)}
                  />
                  <DetailField
                    label="Pending amount"
                    value={
                      pendingAmount != null
                        ? formatMoney(pendingAmount, paymentCurrency)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Expenses"
                    value={
                      profitabilityQuery.data
                        ? formatMoney(
                            profitabilityQuery.data.vendorExpenses.amount,
                            profitabilityQuery.data.vendorExpenses.currency,
                          )
                        : '—'
                    }
                  />
                  <DetailField
                    label="Estimated profit"
                    value={
                      profitabilityQuery.data
                        ? formatMoney(
                            profitabilityQuery.data.grossMargin.amount,
                            profitabilityQuery.data.grossMargin.currency,
                          )
                        : '—'
                    }
                  />
                </dl>
                {progress?.financeDocuments ? (
                  <dl className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField
                      label="Documents"
                      value={progress.financeDocuments.total}
                    />
                    <DetailField
                      label="Pending verification"
                      value={progress.financeDocuments.pendingVerification}
                    />
                    <DetailField
                      label="Missing proofs"
                      value={progress.financeDocuments.missingPaymentProofs}
                    />
                    <DetailField
                      label="Doc actions"
                      value={progress.financeDocuments.outstandingActions}
                    />
                  </dl>
                ) : null}
                <p className="mb-4 text-sm text-muted-foreground">
                  <Link
                    className="underline"
                    href={`/app/finance/booking/?id=${encodeURIComponent(bookingId)}`}
                  >
                    Open booking finance & documents
                  </Link>
                </p>
                <div className="space-y-4">
                  <PaymentsPanel bookingId={bookingId} />
                  <ProfitabilityPanel bookingId={bookingId} />
                </div>
              </ContentCard>
            </PageSection>

            <PageSection>
              <CommunicationsSummaryCard
                bookingId={bookingId}
                progress={progress?.communications}
              />
            </PageSection>

            <PageSection>
              <CalendarSummaryCard bookingId={bookingId} />
            </PageSection>

            <PageSection>
              <ContentCard title="Internal notes">
                <p className="mb-3 text-xs text-muted-foreground">
                  Operational notes — not visible to customers.
                </p>
                <Can permission="workspace:notes:write">
                  <form
                    className="mb-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!noteBody.trim()) return;
                      void createNoteMutation
                        .mutateAsync({ body: noteBody.trim() })
                        .then(() => {
                          toast.success('Note added');
                          setNoteBody('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to add note.',
                          ),
                        );
                    }}
                  >
                    <Input
                      placeholder="Add internal note"
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                    />
                    <Button
                      type="submit"
                      disabled={createNoteMutation.isPending}
                    >
                      Add
                    </Button>
                  </form>
                </Can>
                <ul className="space-y-2">
                  {(notesQuery.data ?? []).map((note) => (
                    <li
                      key={note.id}
                      className="flex items-start justify-between gap-2 rounded-md border border-border p-3 text-sm"
                    >
                      <div>
                        <p>{note.body}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatWhen(note.createdAt)}
                        </p>
                      </div>
                      <Can permission="workspace:notes:write">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void deleteNoteMutation
                              .mutateAsync(note.id)
                              .then(() => toast.success('Note deleted'))
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError
                                    ? err.message
                                    : 'Unable to delete note.',
                                ),
                              )
                          }
                        >
                          Delete
                        </Button>
                      </Can>
                    </li>
                  ))}
                </ul>
                {(notesQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Activity feed">
                {activityQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={4} />
                ) : null}
                <ul className="space-y-2">
                  {(activityQuery.data ?? []).map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatWhen(item.occurredAt)}
                      </span>
                    </li>
                  ))}
                </ul>
                {(activityQuery.data ?? []).length === 0 &&
                !activityQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded yet.
                  </p>
                ) : null}
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate workspace?"
        description="Sets workspaceStatus to active for this booking. This is the direct human command path (ADR-017)."
        confirmLabel="Activate"
        onConfirm={() => void onActivate()}
      />
    </RequirePermission>
  );
}
