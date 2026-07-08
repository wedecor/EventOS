export abstract class AdvancePaymentQuery {
  abstract hasConfirmedAdvance(
    tenantId: string,
    criteria: { leadId?: string; quotationId?: string },
  ): Promise<boolean>;
}
