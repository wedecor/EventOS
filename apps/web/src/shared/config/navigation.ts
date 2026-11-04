import type { Permission } from '@/shared/auth/rbac';

/**
 * Lucide icon keys used by the shell (resolved in the sidebar).
 * Keep this list closed so navigation stays type-safe.
 */
export type NavIconName =
  | 'layout-dashboard'
  | 'users'
  | 'kanban'
  | 'file-text'
  | 'calendar-check'
  | 'calendar-clock'
  | 'party-popper'
  | 'truck'
  | 'hard-hat'
  | 'boxes'
  | 'wallet'
  | 'bar-chart-3'
  | 'line-chart'
  | 'settings'
  | 'building-2'
  | 'briefcase'
  | 'sliders-horizontal'
  | 'users-round'
  | 'layout-template'
  | 'plug'
  | 'shield'
  | 'message-square';

export type NavItem = {
  id: string;
  label: string;
  /** Leaf routes must set href. Group parents may omit (expand/collapse only). */
  href?: string;
  icon: NavIconName;
  /** Single required permission (backend key). */
  permission?: Permission;
  /** Visible if the user has any of these permissions. */
  anyOf?: readonly Permission[];
  /** Nested items (Operations, Settings, …). */
  children?: readonly NavItem[];
};

/**
 * Phase 1 Admin Portal navigation (docs/17 + F1-03).
 * Labels match the shell IA; permissions match backend RBAC only.
 * All linked destinations are placeholder pages until module milestones.
 */
export const MAIN_NAV: readonly NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/app/dashboard/',
    icon: 'layout-dashboard',
    permission: 'dashboards:read',
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/app/customers/',
    icon: 'users',
    permission: 'clients:read',
  },
  {
    id: 'leads',
    label: 'Leads',
    href: '/app/leads/',
    icon: 'kanban',
    permission: 'leads:read',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    href: '/app/quotations/',
    icon: 'file-text',
    permission: 'quotations:read',
  },
  {
    id: 'bookings',
    label: 'Bookings',
    href: '/app/bookings/',
    icon: 'calendar-check',
    permission: 'bookings:read',
  },
  {
    id: 'events',
    label: 'Events',
    href: '/app/events/',
    icon: 'party-popper',
    permission: 'workspace:read',
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'briefcase',
    anyOf: [
      'staff:read',
      'vendors:read',
      'inventory:read',
      'calendar:read',
    ],
    children: [
      {
        id: 'staff',
        label: 'Staff',
        href: '/app/staff/',
        icon: 'hard-hat',
        permission: 'staff:read',
      },
      {
        id: 'staff-scheduling',
        label: 'Scheduling',
        href: '/app/staff/scheduling/',
        icon: 'calendar-check',
        permission: 'staff:read',
      },
      {
        id: 'vendors',
        label: 'Vendors',
        href: '/app/vendors/',
        icon: 'truck',
        permission: 'vendors:read',
      },
      {
        id: 'procurements',
        label: 'Procurements',
        href: '/app/vendors/procurements/',
        icon: 'briefcase',
        permission: 'procurements:read',
      },
      {
        id: 'inventory',
        label: 'Inventory',
        href: '/app/inventory/',
        icon: 'boxes',
        permission: 'inventory:read',
      },
      {
        id: 'calendar',
        label: 'Operations Calendar',
        href: '/app/calendar/',
        icon: 'calendar-clock',
        permission: 'calendar:read',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    href: '/app/finance/',
    icon: 'wallet',
    anyOf: ['invoices:read', 'payments:read', 'expenses:read', 'profitability:read'],
  },
  {
    id: 'communications',
    label: 'Communications',
    href: '/app/communications/',
    icon: 'message-square',
    anyOf: [
      'communications:read',
      'reminders:read',
      'communication-templates:read',
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/app/reports/',
    icon: 'bar-chart-3',
    permission: 'dashboards:read',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/app/analytics/',
    icon: 'line-chart',
    permission: 'analytics:read',
  },
  {
    id: 'security',
    label: 'Security',
    href: '/app/settings/security/',
    icon: 'shield',
    // No permission — any authenticated user may change password (OpenAPI).
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    permission: 'settings:read',
    children: [
      {
        id: 'settings-general',
        label: 'General',
        href: '/app/settings/',
        icon: 'sliders-horizontal',
        permission: 'settings:read',
      },
      {
        id: 'settings-security',
        label: 'Security',
        href: '/app/settings/security/',
        icon: 'shield',
        // Visible whenever Settings group is visible (owner/admin).
      },
      {
        id: 'settings-team',
        label: 'Team',
        href: '/app/settings/team/',
        icon: 'users-round',
        permission: 'settings:read',
      },
      {
        id: 'settings-templates',
        label: 'Templates',
        href: '/app/settings/templates/',
        icon: 'layout-template',
        permission: 'settings:read',
      },
      {
        id: 'settings-integrations',
        label: 'Integrations',
        href: '/app/settings/integrations/',
        icon: 'plug',
        permission: 'settings:read',
      },
    ],
  },
] as const;
