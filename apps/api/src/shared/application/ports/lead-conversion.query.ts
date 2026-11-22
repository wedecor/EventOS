import type { Result } from '../result';

export type LeadConversionContext = {
  customerId: string;
  quotationId: string;
  eventId: string;
};

export abstract class LeadConversionQuery {
  abstract validateForApproval(
    tenantId: string,
    leadId: string,
  ): Promise<Result<LeadConversionContext>>;
}
