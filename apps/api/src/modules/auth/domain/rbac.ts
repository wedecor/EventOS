/**
 * Phase 1 Role-Based Access Control model (docs/14 §Authorization Security,
 * docs/05 §Authorization Model: RBAC + Permissions, docs/09 per-endpoint contracts).
 *
 * Model: `User → Role → Permission(s) → resource:action`. Phase 1 is single-role
 * per user (`AuthenticatedUser.role`), single-tenant (ADR-016). This module is the
 * one source of truth for which roles hold which permissions; the mapping is derived
 * from the role lists documented per endpoint in docs/09-api-design.md.
 *
 * Explicitly OUT of scope (do not add here): organization hierarchy, multi-tenant
 * RBAC, dynamic policy engine, ABAC, external identity providers. These are Phase 2.
 */

/** The nine Phase 1 roles (docs/05 §Authorization Model). */
export const PHASE1_ROLES = [
  'owner',
  'admin',
  'sales_manager',
  'sales',
  'operations_manager',
  'coordinator',
  'finance',
  'marketing',
  'viewer',
] as const;

export type Role = (typeof PHASE1_ROLES)[number];

/**
 * Every granular permission key used across the API (docs/09). Convention:
 * `<resource>:<action>` (docs/14 §Permission Model).
 */
export const PERMISSIONS = [
  // Lead Management (docs/09 §Lead Management)
  'leads:read',
  'leads:write',
  'leads:stage:update',
  'leads:assign',
  'leads:followups:write',
  // Customer / CRM (docs/09 §Customer)
  'clients:read',
  'clients:write',
  'timeline:read',
  'timeline:write',
  'issues:write',
  'reviews:write',
  // Quotation (docs/09 §Quotation)
  'quotations:read',
  'quotations:write',
  'quotations:send',
  'quotations:approve',
  'quotations:reject',
  'quotations:revise',
  // Booking / Event Hub (docs/09 §Booking)
  'bookings:read',
  'bookings:status:update',
  'bookings:cancel',
  'bookings:complete',
  'bookings:execution:advance',
  // Event Workspace (docs/09 §Event Workspace)
  'workspace:read',
  'workspace:activate',
  'workspace:notes:write',
  // Task Management (docs/09 §Task Management)
  'tasks:read',
  'tasks:write',
  'tasks:status:update',
  // Checklist Templates / Event Checklists (P2-02)
  'checklists:read',
  'checklists:write',
  'checklists:execute',
  // Staff Management (docs/09 §Staff Management)
  'staff:read',
  'staff:write',
  // Vendor Procurement (docs/09 §Vendor Procurement)
  'vendors:read',
  'vendors:write',
  'procurements:read',
  'procurements:write',
  'procurement:transition',
  'procurement:notes:write',
  // Inventory (docs/09 §Inventory)
  'inventory:read',
  'inventory:write',
  'inventory:move:write',
  'inventory:move:confirm',
  'inventory:photos:write',
  'inventory:damage-notes:write',
  // Payments (docs/09 §Payments)
  'payments:read',
  'payments:record',
  'payments:void',
  // Finance (docs/09 §Finance)
  'invoices:read',
  'invoices:write',
  'invoices:send',
  'invoices:void',
  'expenses:read',
  'expenses:write',
  'expenses:void',
  'profitability:read',
  // Financial documents (P2-08)
  'documents:read',
  'documents:write',
  'documents:verify',
  // Communication Center (P2-09)
  'communications:read',
  'communications:write',
  'communication-templates:read',
  'communication-templates:write',
  'reminders:read',
  'reminders:write',
  // Unified Operations Calendar (P2-10)
  'calendar:read',
  // Business Intelligence (P2-12)
  'analytics:read',
  // Dashboard (docs/09 §Dashboard)
  'dashboards:read',
  // Administration (docs/09 §Administration)
  'suggestions:read',
  'suggestions:accept',
  'suggestions:dismiss',
  'settings:read',
  'settings:write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS: readonly Permission[] = PERMISSIONS;

/**
 * Role → permission assignment. Mirrors the canonical matrix in
 * `docs/09-api-design.md` §Phase 1 Role × Permission Matrix (R3-09).
 * `owner` and `admin` receive all Phase 1 permissions (including `settings:*`).
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,

  sales_manager: [
    'leads:read',
    'leads:write',
    'leads:stage:update',
    'leads:assign',
    'leads:followups:write',
    'clients:read',
    'clients:write',
    'timeline:read',
    'timeline:write',
    'reviews:write',
    'quotations:read',
    'quotations:write',
    'quotations:send',
    'quotations:approve',
    'quotations:reject',
    'quotations:revise',
    'communications:read',
    'communications:write',
    'communication-templates:read',
    'communication-templates:write',
    'reminders:read',
    'reminders:write',
    'calendar:read',
    'analytics:read',
    'dashboards:read',
  ],

  sales: [
    'leads:read',
    'leads:write',
    'leads:followups:write',
    'clients:read',
    'quotations:read',
    'quotations:write',
    'quotations:send',
  ],

  operations_manager: [
    'leads:read',
    'clients:read',
    'clients:write',
    'timeline:read',
    'timeline:write',
    'issues:write',
    'quotations:approve',
    'bookings:read',
    'bookings:status:update',
    'bookings:cancel',
    'bookings:complete',
    'bookings:execution:advance',
    'workspace:read',
    'workspace:activate',
    'workspace:notes:write',
    'tasks:read',
    'tasks:write',
    'tasks:status:update',
    'checklists:read',
    'checklists:write',
    'checklists:execute',
    'staff:read',
    'staff:write',
    'vendors:read',
    'vendors:write',
    'procurements:read',
    'procurements:write',
    'procurement:transition',
    'procurement:notes:write',
    'inventory:read',
    'inventory:write',
    'inventory:move:write',
    'inventory:move:confirm',
    'inventory:photos:write',
    'inventory:damage-notes:write',
    'communications:read',
    'communications:write',
    'communication-templates:read',
    'communication-templates:write',
    'reminders:read',
    'reminders:write',
    'calendar:read',
    'analytics:read',
    'suggestions:read',
    'suggestions:accept',
    'suggestions:dismiss',
  ],

  coordinator: [
    'leads:read',
    'clients:read',
    'timeline:read',
    'timeline:write',
    'issues:write',
    'bookings:read',
    'bookings:status:update',
    'bookings:execution:advance',
    'workspace:read',
    'workspace:activate',
    'workspace:notes:write',
    'tasks:read',
    'tasks:write',
    'tasks:status:update',
    'checklists:read',
    'checklists:write',
    'checklists:execute',
    'procurements:read',
    'inventory:read',
    'inventory:move:write',
    'inventory:move:confirm',
    'inventory:photos:write',
    'inventory:damage-notes:write',
    'communications:read',
    'communications:write',
    'communication-templates:read',
    'communication-templates:write',
    'reminders:read',
    'reminders:write',
    'calendar:read',
    'analytics:read',
    'suggestions:read',
    'suggestions:accept',
    'suggestions:dismiss',
  ],

  finance: [
    'leads:read',
    'bookings:read',
    'bookings:status:update',
    'bookings:complete',
    'procurements:read',
    'payments:read',
    'payments:record',
    'payments:void',
    'invoices:read',
    'invoices:write',
    'invoices:send',
    'invoices:void',
    'expenses:read',
    'expenses:write',
    'expenses:void',
    'profitability:read',
    'documents:read',
    'documents:write',
    'documents:verify',
    'analytics:read',
  ],

  // Phase 1 marketing has no documented write/read API endpoints in docs/09
  // (lead-source visibility + content library are Phase 2 surfaces). Intentionally
  // empty — see implementation report.
  marketing: [],

  // Read-only across assigned modules (docs/05). Union of every documented
  // read permission whose endpoint role list includes `viewer`.
  viewer: [
    'leads:read',
    'clients:read',
    'timeline:read',
    'quotations:read',
    'bookings:read',
    'workspace:read',
    'tasks:read',
    'checklists:read',
    'staff:read',
    'vendors:read',
    'procurements:read',
    'inventory:read',
    'payments:read',
    'invoices:read',
    'expenses:read',
    'profitability:read',
    'documents:read',
    'communications:read',
    'communication-templates:read',
    'reminders:read',
    'calendar:read',
    'analytics:read',
    'dashboards:read',
  ],
};

/** Type guard: is the given string a recognised Phase 1 role? */
export function isRole(value: string): value is Role {
  return (PHASE1_ROLES as readonly string[]).includes(value);
}
