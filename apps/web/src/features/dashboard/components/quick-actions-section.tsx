'use client';

import Link from 'next/link';
import {
  CalendarCheck,
  FileText,
  Kanban,
  PartyPopper,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Can } from '@/features/auth';
import type { Permission } from '@/shared/auth/rbac';
import { Button } from '@/shared/components/ui/button';
import { ContentCard } from '@/shared/components/page';

type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  anyOf?: readonly Permission[];
};

const actions: readonly QuickAction[] = [
  {
    id: 'customer',
    label: 'New Customer',
    href: '/app/customers/new/',
    permission: 'clients:write',
    icon: Users,
  },
  {
    id: 'lead',
    label: 'New Lead',
    href: '/app/leads/new/',
    permission: 'leads:write',
    icon: Kanban,
  },
  {
    id: 'quotation',
    label: 'New Quotation',
    href: '/app/quotations/new/',
    permission: 'quotations:write',
    icon: FileText,
  },
  {
    id: 'booking',
    label: 'View Bookings',
    href: '/app/bookings/',
    permission: 'bookings:read',
    icon: CalendarCheck,
  },
  {
    id: 'events',
    label: 'View Events',
    href: '/app/events/',
    permission: 'workspace:read',
    icon: PartyPopper,
  },
];

/**
 * Permission-gated shortcuts to create/list hubs for shipped module flows.
 * Booking uses View Bookings — Phase 1 RBAC has no bookings:write.
 */
export function QuickActionsSection() {
  return (
    <ContentCard
      title="Quick actions"
      description="Jump to create forms or hubs for modules you can access"
    >
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const button = (
            <Button asChild variant="outline" size="sm">
              <Link href={action.href}>
                <Icon className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          );

          if (action.anyOf) {
            return (
              <Can key={action.id} anyOf={action.anyOf}>
                {button}
              </Can>
            );
          }

          return (
            <Can key={action.id} permission={action.permission}>
              {button}
            </Can>
          );
        })}
      </div>
    </ContentCard>
  );
}
