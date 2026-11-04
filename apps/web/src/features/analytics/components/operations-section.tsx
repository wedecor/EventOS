'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { formatConversionRate } from '@/features/dashboard/lib/format';
import { DataTable } from '@/shared/components/data-display/data-table';
import {
  useAnalyticsCustomersQuery,
  useAnalyticsInventoryQuery,
  useAnalyticsOperationsQuery,
  useAnalyticsStaffQuery,
  useAnalyticsVendorsQuery,
} from '../hooks/use-analytics-queries';
import type { AnalyticsPeriodParams } from '../schemas/analytics.schemas';
import { CountBreakdownTable } from './count-breakdown-table';
import { DateRangeFilter } from './date-range-filter';

type OperationsSectionProps = {
  enabled: boolean;
};

type WorkloadRow = {
  staffMemberId: string;
  name: string;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  upcomingConfirmed: number;
};

type VendorSpendRow = {
  vendorId: string;
  spend: number;
  procurements: number;
};

type DispatchRow = { month: string; dispatched: number; returned: number };
type EventTypeCountRow = { eventType: string; count: number };
type ChannelRow = { channel: string; count: number };

const workloadColumns: ColumnDef<WorkloadRow>[] = [
  { accessorKey: 'name', header: 'Staff' },
  { accessorKey: 'eventsToday', header: 'Today' },
  { accessorKey: 'eventsThisWeek', header: 'This week' },
  { accessorKey: 'eventsThisMonth', header: 'This month' },
  { accessorKey: 'upcomingConfirmed', header: 'Upcoming confirmed' },
];

const vendorSpendColumns: ColumnDef<VendorSpendRow>[] = [
  { accessorKey: 'vendorId', header: 'Vendor ID' },
  { accessorKey: 'spend', header: 'Spend' },
  { accessorKey: 'procurements', header: 'Procurements' },
];

const dispatchColumns: ColumnDef<DispatchRow>[] = [
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'dispatched', header: 'Dispatched' },
  { accessorKey: 'returned', header: 'Returned' },
];

const eventTypeColumns: ColumnDef<EventTypeCountRow>[] = [
  { accessorKey: 'eventType', header: 'Event type' },
  { accessorKey: 'count', header: 'Count' },
];

const channelColumns: ColumnDef<ChannelRow>[] = [
  { accessorKey: 'channel', header: 'Channel' },
  { accessorKey: 'count', header: 'Count' },
];

export function OperationsSection({ enabled }: OperationsSectionProps) {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [customerParams, setCustomerParams] = useState<AnalyticsPeriodParams>({});

  const operationsQuery = useAnalyticsOperationsQuery(enabled);
  const staffQuery = useAnalyticsStaffQuery(enabled);
  const vendorsQuery = useAnalyticsVendorsQuery(enabled);
  const inventoryQuery = useAnalyticsInventoryQuery(enabled);
  const customersQuery = useAnalyticsCustomersQuery(customerParams, enabled);

  const ops = operationsQuery.data;
  const staff = staffQuery.data;
  const vendors = vendorsQuery.data;
  const inventory = inventoryQuery.data;
  const customers = customersQuery.data;

  return (
    <div className="space-y-6">
      <DashboardWidget
        title="Operations snapshot"
        description="GET /api/v1/analytics/operations"
        isLoading={operationsQuery.isLoading}
        isError={operationsQuery.isError}
        error={operationsQuery.error}
        onRetry={() => void operationsQuery.refetch()}
      >
        {ops ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Today's events" value={String(ops.todaysEvents)} />
            <KpiCard label="Upcoming events" value={String(ops.upcomingEvents)} />
            <KpiCard label="Active bookings" value={String(ops.activeBookings)} />
            <KpiCard label="Overdue tasks" value={String(ops.overdueTasks)} />
            <KpiCard
              label="Pending procurements"
              value={String(ops.pendingProcurements)}
            />
            <KpiCard
              label="Pending reminders"
              value={String(ops.pendingReminders)}
            />
            <KpiCard
              label="Overdue reminders"
              value={String(ops.overdueReminders)}
            />
            <KpiCard
              label="Inventory issues"
              value={String(ops.inventoryIssues)}
            />
            <KpiCard
              label="Outstanding documents"
              value={String(ops.outstandingDocuments)}
            />
          </div>
        ) : null}
      </DashboardWidget>

      <DashboardWidget
        title="Staff utilisation"
        description="GET /api/v1/analytics/staff"
        isLoading={staffQuery.isLoading}
        isError={staffQuery.isError}
        error={staffQuery.error}
        onRetry={() => void staffQuery.refetch()}
      >
        {staff ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Utilisation"
                value={formatConversionRate(staff.utilisationRate)}
              />
              <KpiCard label="Total staff" value={String(staff.totalStaff)} />
              <KpiCard label="Active staff" value={String(staff.activeStaff)} />
              <KpiCard
                label="Events assigned"
                value={String(staff.eventsAssigned)}
              />
              <KpiCard
                label="Leave approved"
                value={String(staff.leaveSummary.approved)}
              />
              <KpiCard
                label="Leave requested"
                value={String(staff.leaveSummary.requested)}
              />
            </div>
            {staff.workload.length > 0 ? (
              <DataTable columns={workloadColumns} data={staff.workload} />
            ) : (
              <p className="text-sm text-muted-foreground">No workload rows.</p>
            )}
          </div>
        ) : null}
      </DashboardWidget>

      <DashboardWidget
        title="Vendors & procurement"
        description="GET /api/v1/analytics/vendors"
        isLoading={vendorsQuery.isLoading}
        isError={vendorsQuery.isError}
        error={vendorsQuery.error}
        onRetry={() => void vendorsQuery.refetch()}
      >
        {vendors ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Total procurements"
                value={String(vendors.totalProcurements)}
              />
              <KpiCard
                label="Completion rate"
                value={formatConversionRate(vendors.completionRate)}
              />
              <KpiCard
                label="Quote win rate"
                value={formatConversionRate(vendors.quoteWinRate)}
              />
              <KpiCard
                label="Delivered"
                value={String(vendors.deliveryPerformance.delivered)}
              />
              <KpiCard
                label="Pending"
                value={String(vendors.deliveryPerformance.pending)}
              />
              <KpiCard
                label="Partial"
                value={String(vendors.deliveryPerformance.partial)}
              />
              <KpiCard
                label="Cancelled"
                value={String(vendors.deliveryPerformance.cancelled)}
              />
            </div>
            {vendors.spendByVendor.length > 0 ? (
              <DataTable
                columns={vendorSpendColumns}
                data={vendors.spendByVendor}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No vendor spend rows.</p>
            )}
          </div>
        ) : null}
      </DashboardWidget>

      <DashboardWidget
        title="Inventory operations"
        description="GET /api/v1/analytics/inventory"
        isLoading={inventoryQuery.isLoading}
        isError={inventoryQuery.isError}
        error={inventoryQuery.error}
        onRetry={() => void inventoryQuery.refetch()}
      >
        {inventory ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Reservations"
                value={String(inventory.reservations)}
              />
              <KpiCard
                label="Active reservations"
                value={String(inventory.activeReservations)}
              />
              <KpiCard
                label="Usage movements"
                value={String(inventory.usageMovements)}
              />
              <KpiCard
                label="Damage incidents"
                value={String(inventory.damageIncidents)}
              />
              <KpiCard
                label="Stock availability"
                value={formatConversionRate(inventory.stockAvailabilityRate)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Movements by status
              </p>
              <CountBreakdownTable record={inventory.movementsByStatus} />
            </div>
            {inventory.dispatchTrends.length > 0 ? (
              <DataTable
                columns={dispatchColumns}
                data={inventory.dispatchTrends}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No dispatch trends.</p>
            )}
          </div>
        ) : null}
      </DashboardWidget>

      <div className="space-y-4">
        <DateRangeFilter
          idPrefix="customers"
          fromInput={fromInput}
          toInput={toInput}
          onFromChange={setFromInput}
          onToChange={setToInput}
          onApply={() =>
            setCustomerParams({
              from: fromInput.trim() || undefined,
              to: toInput.trim() || undefined,
            })
          }
          onClear={() => {
            setFromInput('');
            setToInput('');
            setCustomerParams({});
          }}
        />

        <DashboardWidget
          title="Customer analytics"
          description="GET /api/v1/analytics/customers"
          isLoading={customersQuery.isLoading}
          isError={customersQuery.isError}
          error={customersQuery.error}
          onRetry={() => void customersQuery.refetch()}
        >
          {customers ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Total customers"
                  value={String(customers.totalCustomers)}
                />
                <KpiCard
                  label="New customers"
                  value={String(customers.newCustomers)}
                />
                <KpiCard
                  label="Returning"
                  value={String(customers.returningCustomers)}
                />
                <KpiCard
                  label="Repeat rate"
                  value={formatConversionRate(customers.repeatRate)}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Health distribution
                </p>
                <CountBreakdownTable
                  record={{
                    active: customers.healthDistribution.active,
                    returning: customers.healthDistribution.returning,
                    dormant: customers.healthDistribution.dormant,
                    follow_up_required:
                      customers.healthDistribution.follow_up_required,
                  }}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Event type distribution
                  </p>
                  {customers.eventTypeDistribution.length > 0 ? (
                    <DataTable
                      columns={eventTypeColumns}
                      data={customers.eventTypeDistribution}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No rows.</p>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Communication trends
                  </p>
                  {customers.communicationTrends.length > 0 ? (
                    <DataTable
                      columns={channelColumns}
                      data={customers.communicationTrends}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No rows.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DashboardWidget>
      </div>
    </div>
  );
}
