import type { Permission } from '@/shared/auth/rbac';
import { MAIN_NAV } from '@/shared/config/navigation';
import { filterNavByPermissions, flattenNavLinks } from './filter-nav';

/** Always reachable for any authenticated user (change-password). */
export const AUTHENTICATED_FALLBACK_HREF = '/app/settings/security/';

/**
 * First MAIN_NAV leaf the user is allowed to open.
 * Avoids hardcoding /app/dashboard/ (requires dashboards:read).
 */
export function resolveDefaultAppHref(
  hasPermission: (permission: Permission) => boolean,
): string {
  const allowed = filterNavByPermissions(MAIN_NAV, hasPermission);
  const links = flattenNavLinks(allowed);
  return links[0]?.href ?? AUTHENTICATED_FALLBACK_HREF;
}
