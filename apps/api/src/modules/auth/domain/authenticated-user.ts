// The identity resolved from a validated access token and attached to the request
// by the JWT strategy. Exposed to controllers via the `@CurrentUser()` decorator.
// `role` feeds PermissionsGuard / RolesGuard (ADR-008 / C4 RBAC).
export type AuthenticatedUser = {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
};
