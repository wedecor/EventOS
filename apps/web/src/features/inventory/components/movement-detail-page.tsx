'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/forms/form';
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
  useAddDamageNoteMutation,
  useCreateDamageReportMutation,
  useCreateVerificationMutation,
  useInventoryMovementQuery,
  useMovementDamageReportsQuery,
  useMovementVerificationsQuery,
  useTransitionMovementMutation,
} from '../hooks/use-inventory-queries';
import { formatMovementStatus, formatWhen } from '../lib/format';
import {
  NEXT_MOVEMENT_STATUS,
  addDamageNoteFormSchema,
  toAddDamageNoteRequest,
  toTransitionRequest,
  type AddDamageNoteFormValues,
  type MovementStatus,
  type TransitionInventoryMovementRequest,
} from '../schemas/inventory.schemas';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

export function MovementDetailPage() {
  const pathname = usePathname() ?? '/app/inventory/movements/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useInventoryMovementQuery(id);
  const verificationsQuery = useMovementVerificationsQuery(id);
  const damageReportsQuery = useMovementDamageReportsQuery(id);
  const transitionMutation = useTransitionMovementMutation(id ?? '');
  const damageMutation = useAddDamageNoteMutation(id ?? '');
  const verificationMutation = useCreateVerificationMutation(id ?? '');
  const damageReportMutation = useCreateDamageReportMutation(id ?? '');
  const [noteOpen, setNoteOpen] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [driverName, setDriverName] = useState('');
  const [expectedQty, setExpectedQty] = useState('');
  const [actualQty, setActualQty] = useState('');

  const noteForm = useForm<AddDamageNoteFormValues>({
    resolver: zodResolver(addDamageNoteFormSchema),
    defaultValues: { message: '', accountability: '' },
  });

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data
      ? formatMovementStatus(query.data.status)
      : 'Movement',
  });

  const nextStatus = query.data
    ? NEXT_MOVEMENT_STATUS[query.data.status]
    : null;

  const onTransition = async () => {
    if (!id || !query.data || !nextStatus) return;
    try {
      const body = {
        ...toTransitionRequest(
          nextStatus as Exclude<MovementStatus, 'planned'>,
          transitionNotes,
        ),
        ...(vehicle.trim() ? { vehicle: vehicle.trim() } : {}),
        ...(driverName.trim() ? { driverName: driverName.trim() } : {}),
      } as TransitionInventoryMovementRequest;
      await transitionMutation.mutateAsync({
        body,
        version: query.data.version,
      });
      toast.success(`Moved to ${formatMovementStatus(nextStatus)}`);
      setTransitionNotes('');
      setVehicle('');
      setDriverName('');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to transition movement.',
      );
    }
  };

  const onVerify = async () => {
    if (!id) return;
    const expectedQuantity = Number(expectedQty);
    const actualQuantity = Number(actualQty);
    if (
      !Number.isInteger(expectedQuantity) ||
      !Number.isInteger(actualQuantity) ||
      expectedQuantity < 0 ||
      actualQuantity < 0
    ) {
      toast.error('Enter non-negative integer quantities.');
      return;
    }
    try {
      await verificationMutation.mutateAsync({
        expectedQuantity,
        actualQuantity,
      });
      toast.success('Verification recorded');
      setExpectedQty('');
      setActualQty('');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to record verification.',
      );
    }
  };

  const onDamageReport = async () => {
    if (!id) return;
    try {
      await damageReportMutation.mutateAsync({
        damageType: 'breakage',
        severity: 'medium',
        quantity: 1,
        notes: 'Reported from movement detail',
      });
      toast.success('Damage report recorded');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to record damage report.',
      );
    }
  };

  const onAddNote = async (values: AddDamageNoteFormValues) => {
    if (!id) return;
    try {
      await damageMutation.mutateAsync(toAddDamageNoteRequest(values));
      toast.success(
        'Damage note added (history list is not available in the API)',
      );
      noteForm.reset({ message: '', accountability: '' });
      setNoteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to add damage note.',
      );
    }
  };

  return (
    <RequirePermission permission="inventory:read">
      <PageLayout>
        <PageHeader
          title="Inventory movement"
          description="GET /api/v1/inventory/movements/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {query.data ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/inventory/movements/?bookingId=${encodeURIComponent(query.data.bookingId)}`}
                  >
                    Booking movements
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/inventory/">Inventory</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing movement id"
              description="Open a movement with ?id=<uuid>."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={6} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load movement"
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
          <>
            <PageSection>
              <ContentCard title="Summary">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Movement ID" value={query.data.id} />
                  <DetailField
                    label="Status"
                    value={formatMovementStatus(query.data.status)}
                  />
                  <DetailField
                    label="Booking"
                    value={
                      <Link
                        className="text-primary underline-offset-2 hover:underline"
                        href={`/app/bookings/view/?id=${encodeURIComponent(query.data.bookingId)}`}
                      >
                        {query.data.bookingId}
                      </Link>
                    }
                  />
                  <DetailField
                    label="Inventory item"
                    value={
                      <Link
                        className="text-primary underline-offset-2 hover:underline"
                        href={`/app/inventory/view/?id=${encodeURIComponent(query.data.inventoryItemId)}`}
                      >
                        {query.data.inventoryItemId}
                      </Link>
                    }
                  />
                  <DetailField
                    label="Quantity"
                    value={String(query.data.quantity)}
                  />
                  <DetailField
                    label="Version"
                    value={String(query.data.version)}
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Notes"
                      value={query.data.notes ?? '—'}
                    />
                  </div>
                  <DetailField
                    label="Picked"
                    value={formatWhen(query.data.pickedAt)}
                  />
                  <DetailField
                    label="Packing started"
                    value={formatWhen(query.data.packingStartedAt)}
                  />
                  <DetailField
                    label="Packed"
                    value={formatWhen(query.data.packedAt)}
                  />
                  <DetailField
                    label="Verified"
                    value={formatWhen(query.data.verifiedAt)}
                  />
                  <DetailField
                    label="Ready for dispatch"
                    value={formatWhen(query.data.readyForDispatchAt)}
                  />
                  <DetailField
                    label="Loaded"
                    value={formatWhen(query.data.loadedAt)}
                  />
                  <DetailField
                    label="Dispatched"
                    value={formatWhen(query.data.dispatchedAt)}
                  />
                  <DetailField
                    label="Vehicle"
                    value={query.data.vehicle ?? '—'}
                  />
                  <DetailField
                    label="Driver"
                    value={query.data.driverName ?? '—'}
                  />
                  <DetailField
                    label="At venue"
                    value={formatWhen(query.data.atVenueAt)}
                  />
                  <DetailField
                    label="Returned"
                    value={formatWhen(query.data.returnedAt)}
                  />
                  <DetailField
                    label="Return verified"
                    value={formatWhen(query.data.returnVerifiedAt)}
                  />
                  <DetailField
                    label="Returned qty"
                    value={
                      query.data.returnedQuantity != null
                        ? String(query.data.returnedQuantity)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Missing qty"
                    value={
                      query.data.missingQuantity != null
                        ? String(query.data.missingQuantity)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Damaged qty"
                    value={
                      query.data.damagedQuantity != null
                        ? String(query.data.damagedQuantity)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Cleaned / ready"
                    value={formatWhen(query.data.cleanedReadyAt)}
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Verification history">
                {verificationsQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={2} />
                ) : null}
                {(verificationsQuery.data ?? []).length === 0 ? (
                  <p className="mb-3 text-sm text-muted-foreground">
                    No structured verifications yet.
                  </p>
                ) : (
                  <ul className="mb-3 space-y-2 text-sm">
                    {(verificationsQuery.data ?? []).map((row) => (
                      <li
                        key={row.id}
                        className="rounded-md border border-border p-2"
                      >
                        {row.result.toUpperCase()} · expected{' '}
                        {row.expectedQuantity} / actual {row.actualQuantity}{' '}
                        (diff {row.difference}) · {formatWhen(row.verifiedAt)}
                      </li>
                    ))}
                  </ul>
                )}
                <Can permission="inventory:move:confirm">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      placeholder="Expected qty"
                      value={expectedQty}
                      onChange={(e) => setExpectedQty(e.target.value)}
                    />
                    <Input
                      placeholder="Actual qty"
                      value={actualQty}
                      onChange={(e) => setActualQty(e.target.value)}
                    />
                    <Button
                      type="button"
                      disabled={verificationMutation.isPending}
                      onClick={() => void onVerify()}
                    >
                      Record verification
                    </Button>
                  </div>
                </Can>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Transition">
                <p className="mb-3 text-xs text-muted-foreground">
                  Operational FSM via POST …/transition with If-Match. Preferred
                  next step follows packing → dispatch → return verification.
                </p>
                {nextStatus ? (
                  <Can permission="inventory:move:confirm">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Optional notes
                        </label>
                        <Input
                          value={transitionNotes}
                          onChange={(e) => setTransitionNotes(e.target.value)}
                          disabled={transitionMutation.isPending}
                        />
                      </div>
                      {(nextStatus === 'loaded' ||
                        nextStatus === 'dispatched') && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            placeholder="Vehicle"
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                          />
                          <Input
                            placeholder="Driver"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        disabled={transitionMutation.isPending}
                        onClick={() => void onTransition()}
                      >
                        Advance to {formatMovementStatus(nextStatus)}
                      </Button>
                    </div>
                  </Can>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Movement is terminal (cleaned / ready or cancelled).
                  </p>
                )}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Structured damage reports">
                {(damageReportsQuery.data ?? []).length === 0 ? (
                  <p className="mb-3 text-sm text-muted-foreground">
                    No structured damage reports yet (photo metadata only).
                  </p>
                ) : (
                  <ul className="mb-3 space-y-2 text-sm">
                    {(damageReportsQuery.data ?? []).map((row) => (
                      <li
                        key={row.id}
                        className="rounded-md border border-border p-2"
                      >
                        {row.damageType} · {row.severity} · qty {row.quantity}
                        {row.notes ? ` · ${row.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                <Can permission="inventory:damage-notes:write">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={damageReportMutation.isPending}
                      onClick={() => void onDamageReport()}
                    >
                      Report breakage (qty 1)
                    </Button>
                  </div>
                </Can>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Damage / loss notes">
                <p className="mb-3 text-xs text-muted-foreground">
                  Legacy POST …/damage-notes remains available. Structured
                  reports above are preferred for P2-07.
                </p>
                <Can permission="inventory:damage-notes:write">
                  {!noteOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNoteOpen(true)}
                    >
                      Add damage note
                    </Button>
                  ) : (
                    <Form {...noteForm}>
                      <form
                        className="space-y-3"
                        noValidate
                        onSubmit={noteForm.handleSubmit(onAddNote)}
                      >
                        <FormField
                          control={noteForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={damageMutation.isPending}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={noteForm.control}
                          name="accountability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Accountability</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={damageMutation.isPending}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={damageMutation.isPending}
                          >
                            Save note
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={damageMutation.isPending}
                            onClick={() => setNoteOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </Can>
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
