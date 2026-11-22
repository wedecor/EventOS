import type { NavItem } from '@/shared/config/navigation';
import type { Permission } from '@/shared/auth/rbac';

export function isNavItemAllowed(
  item: NavItem,
  hasPermission: (permission: Permission) => boolean,
): boolean {
  if (item.permission && !hasPermission(item.permission)) {
    return false;
  }
  if (item.anyOf && item.anyOf.length > 0) {
    return item.anyOf.some((p) => hasPermission(p));
  }
  return true;
}

/**
 * Recursively filter navigation by backend permissions.
 * Group parents remain only when they still have visible children.
 */
export function filterNavByPermissions(
  items: readonly NavItem[],
  hasPermission: (permission: Permission) => boolean,
): NavItem[] {
  const result: NavItem[] = [];

  for (const item of items) {
    if (!isNavItemAllowed(item, hasPermission)) {
      continue;
    }

    if (item.children?.length) {
      const children = filterNavByPermissions(item.children, hasPermission);
      if (children.length === 0 && !item.href) {
        continue;
      }
      result.push({ ...item, children });
      continue;
    }

    result.push(item);
  }

  return result;
}

/** Flatten navigable leaves (items with href) for tests / command palette later. */
export function flattenNavLinks(items: readonly NavItem[]): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (item.href) out.push(item);
    if (item.children) out.push(...flattenNavLinks(item.children));
  }
  return out;
}

export function isNavActive(pathname: string, href: string | undefined): boolean {
  if (!href) return false;
  if (pathname === href) return true;
  // Avoid treating `/app/` as active for every route.
  if (href === '/app/' || href === '/app/dashboard/') {
    return pathname === '/app/' || pathname === '/app/dashboard/';
  }
  return pathname.startsWith(href);
}
