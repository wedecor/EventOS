import type { BreadcrumbItem } from '@/shared/components/layout/breadcrumbs';

/**
 * Segment → title map for automatic breadcrumbs under `/app`.
 * Dynamic segments (UUIDs, etc.) fall back to a shortened id unless overridden.
 */
export const ROUTE_TITLES: Record<string, string> = {
  app: 'Home',
  dashboard: 'Dashboard',
  customers: 'Customers',
  new: 'New',
  view: 'View',
  edit: 'Edit',
  leads: 'Leads',
  quotations: 'Quotations',
  bookings: 'Bookings',
  events: 'Events',
  workspace: 'Workspace',
  staff: 'Staff',
  vendors: 'Vendors',
  inventory: 'Inventory',
  movements: 'Movements',
  finance: 'Finance',
  booking: 'Booking',
  calendar: 'Operations Calendar',
  communications: 'Communications',
  reminders: 'Reminders',
  reports: 'Reports',
  analytics: 'Analytics',
  settings: 'Settings',
  security: 'Security',
  team: 'Team',
  templates: 'Templates',
  integrations: 'Integrations',
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function titleForSegment(segment: string): string {
  if (ROUTE_TITLES[segment]) {
    return ROUTE_TITLES[segment];
  }
  if (UUID_RE.test(segment)) {
    return segment.slice(0, 8);
  }
  return segment
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export type BuildBreadcrumbsOptions = {
  /** Override the final crumb title (e.g. entity name). */
  currentTitle?: string;
  /** Extra crumbs appended after path-derived ones (before current). */
  extras?: BreadcrumbItem[];
};

/**
 * Build breadcrumbs from a pathname (supports nested + dynamic segments).
 */
export function buildBreadcrumbs(
  pathname: string,
  options: BuildBreadcrumbsOptions = {},
): BreadcrumbItem[] {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length === 0) {
    return [{ label: 'Home' }];
  }

  const items: BreadcrumbItem[] = [];
  let acc = '';

  for (let i = 0; i < parts.length; i += 1) {
    const segment = parts[i]!;
    acc += `/${segment}`;
    const isLast = i === parts.length - 1;
    const href = `${acc}/`;

    if (segment === 'app' && parts.length > 1) {
      items.push({ label: 'Home', href: '/app/' });
      continue;
    }

    const label =
      isLast && options.currentTitle
        ? options.currentTitle
        : titleForSegment(segment);

    items.push({
      label,
      href: isLast ? undefined : href,
    });
  }

  if (options.extras?.length) {
    const last = items.pop();
    items.push(...options.extras);
    if (last) items.push(last);
  }

  return items;
}
