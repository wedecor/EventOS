'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Button } from '@/shared/components/ui/button';
import { ContentCard } from '@/shared/components/page';
import {
  useCreateAvailabilityMutation,
  useCreateLeaveMutation,
  useDeleteAvailabilityMutation,
  useReviewLeaveMutation,
  useStaffAvailabilityQuery,
  useStaffLeaveQuery,
  useStaffWorkloadQuery,
} from '../hooks/use-scheduling-queries';
import {
  formatDateLike,
  type StaffAvailability,
  type StaffLeave,
} from '../schemas/scheduling.schemas';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type Props = {
  staffMemberId: string;
};

export function StaffSchedulingPanel({ staffMemberId }: Props) {
  const availabilityQuery = useStaffAvailabilityQuery(staffMemberId);
  const leaveQuery = useStaffLeaveQuery(staffMemberId);
  const workloadQuery = useStaffWorkloadQuery(staffMemberId);
  const createAvailability = useCreateAvailabilityMutation(staffMemberId);
  const deleteAvailability = useDeleteAvailabilityMutation(staffMemberId);
  const createLeave = useCreateLeaveMutation(staffMemberId);
  const reviewLeave = useReviewLeaveMutation(staffMemberId);

  const [kind, setKind] = useState<StaffAvailability['kind']>('unavailable');
  const [date, setDate] = useState('');
  const [weekday, setWeekday] = useState('');
  const [reason, setReason] = useState('');

  const [leaveType, setLeaveType] =
    useState<StaffLeave['leaveType']>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');

  const workload = workloadQuery.data?.[0];

  return (
    <div className="space-y-4">
      <ContentCard title="Workload">
        {workloadQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading workload…</p>
        ) : workload ? (
          <dl className="grid gap-3 sm:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Today</dt>
              <dd className="font-medium">{workload.eventsToday}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">This week</dt>
              <dd className="font-medium">{workload.eventsThisWeek}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">This month</dt>
              <dd className="font-medium">{workload.eventsThisMonth}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Upcoming</dt>
              <dd className="font-medium">{workload.upcomingConfirmed}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No workload data.</p>
        )}
      </ContentCard>

      <ContentCard title="Availability">
        <Can permission="staff:write">
          <form
            className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!date && weekday === '') {
                toast.error('Provide a date or weekday.');
                return;
              }
              void createAvailability
                .mutateAsync({
                  staffMemberId,
                  kind,
                  date: date || null,
                  weekday: weekday === '' ? null : Number(weekday),
                  reason: reason || null,
                })
                .then(() => {
                  toast.success('Availability saved');
                  setDate('');
                  setWeekday('');
                  setReason('');
                })
                .catch((err) =>
                  toast.error(
                    err instanceof ApiError
                      ? err.message
                      : 'Unable to save availability.',
                  ),
                );
            }}
          >
            <select
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as StaffAvailability['kind'])
              }
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="partial_day">Partial day</option>
              <option value="holiday">Holiday</option>
            </select>
            <input
              type="date"
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (e.target.value) setWeekday('');
              }}
            />
            <select
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={weekday}
              onChange={(e) => {
                setWeekday(e.target.value);
                if (e.target.value !== '') setDate('');
              }}
            >
              <option value="">Recurring weekday…</option>
              {WEEKDAYS.map((label, i) => (
                <option key={label} value={String(i)}>
                  {label}
                </option>
              ))}
            </select>
            <input
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button type="submit" disabled={createAvailability.isPending}>
              Add
            </Button>
          </form>
        </Can>
        <ul className="space-y-2">
          {(availabilityQuery.data ?? []).map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium capitalize">
                  {entry.kind.replace('_', ' ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.date
                    ? formatDateLike(entry.date)
                    : entry.weekday !== null
                      ? `Every ${WEEKDAYS[entry.weekday]}`
                      : '—'}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </p>
              </div>
              <Can permission="staff:write">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void deleteAvailability
                      .mutateAsync(entry.id)
                      .then(() => toast.success('Removed'))
                      .catch((err) =>
                        toast.error(
                          err instanceof ApiError
                            ? err.message
                            : 'Unable to delete.',
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
        {(availabilityQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No availability entries yet.
          </p>
        ) : null}
      </ContentCard>

      <ContentCard title="Leave">
        <Can permission="staff:write">
          <form
            className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!leaveStart || !leaveEnd) return;
              void createLeave
                .mutateAsync({
                  staffMemberId,
                  leaveType,
                  startDate: leaveStart,
                  endDate: leaveEnd,
                })
                .then(() => {
                  toast.success('Leave requested');
                  setLeaveStart('');
                  setLeaveEnd('');
                })
                .catch((err) =>
                  toast.error(
                    err instanceof ApiError
                      ? err.message
                      : 'Unable to request leave.',
                  ),
                );
            }}
          >
            <select
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={leaveType}
              onChange={(e) =>
                setLeaveType(e.target.value as StaffLeave['leaveType'])
              }
            >
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="vacation">Vacation</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
            <input
              type="date"
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={leaveStart}
              onChange={(e) => setLeaveStart(e.target.value)}
            />
            <input
              type="date"
              className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
              value={leaveEnd}
              onChange={(e) => setLeaveEnd(e.target.value)}
            />
            <Button
              type="submit"
              className="lg:col-span-2"
              disabled={createLeave.isPending || !leaveStart || !leaveEnd}
            >
              Request leave
            </Button>
          </form>
        </Can>
        <ul className="space-y-2">
          {(leaveQuery.data ?? []).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium capitalize">
                  {row.leaveType} · {row.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateLike(row.startDate)} →{' '}
                  {formatDateLike(row.endDate)}
                </p>
              </div>
              <Can permission="staff:write">
                <div className="flex flex-wrap gap-1">
                  {row.status === 'requested' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void reviewLeave
                            .mutateAsync({
                              id: row.id,
                              status: 'approved',
                              version: row.version,
                            })
                            .then(() => toast.success('Approved'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Unable to approve.',
                              ),
                            )
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void reviewLeave
                            .mutateAsync({
                              id: row.id,
                              status: 'rejected',
                              version: row.version,
                            })
                            .then(() => toast.success('Rejected'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Unable to reject.',
                              ),
                            )
                        }
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {row.status === 'requested' || row.status === 'approved' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        void reviewLeave
                          .mutateAsync({
                            id: row.id,
                            status: 'cancelled',
                            version: row.version,
                          })
                          .then(() => toast.success('Cancelled'))
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Unable to cancel.',
                            ),
                          )
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </Can>
            </li>
          ))}
        </ul>
        {(leaveQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No leave requests.</p>
        ) : null}
      </ContentCard>
    </div>
  );
}
