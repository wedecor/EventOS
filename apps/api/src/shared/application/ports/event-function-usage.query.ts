/**
 * M5-01 — answers "is this event function referenced by anything else?" so the
 * Enquiries feed marks an in-use function `cancelled` instead of deleting it.
 *
 * Nothing references functions yet (gig shifts arrive with P3-01, which will
 * replace the default no-op implementation).
 */
export abstract class EventFunctionUsageQuery {
  abstract findInUseFunctionIds(
    tenantId: string,
    functionIds: readonly string[],
  ): Promise<ReadonlySet<string>>;
}
