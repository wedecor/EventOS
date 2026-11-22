import type { LeadDto } from './lead.dto';

export type LeadListItemDto = LeadDto & {
  customerDisplayName?: string | null;
};

export function toLeadListItemDto(
  lead: LeadDto,
  customerDisplayName?: string | null,
): LeadListItemDto {
  if (customerDisplayName === undefined) {
    return lead;
  }
  return { ...lead, customerDisplayName };
}
