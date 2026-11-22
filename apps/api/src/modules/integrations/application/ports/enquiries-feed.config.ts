/**
 * M5-01 — runtime configuration of the Enquiries feed. Secrets come from Secret
 * Manager via env; the tenant is resolved from config, never from a request.
 */
export abstract class EnquiriesFeedConfig {
  /** Active signing secrets (primary first, then the rotation `_NEXT` secret). */
  abstract readonly secrets: readonly string[];
  abstract readonly tenantId: string;
}
