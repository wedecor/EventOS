import { Injectable } from '@nestjs/common';
import { failure, success, type Result } from '../result';
import { EventRepository } from '../../../modules/booking/domain/repositories/event.repository';
import { LeadRepository } from '../../../modules/lead/domain/repositories/lead.repository';
import { QuotationRepository } from '../../../modules/quotation/domain/repositories/quotation.repository';
import {
  LeadConversionQuery,
  type LeadConversionContext,
} from './lead-conversion.query';

@Injectable()
export class PrismaLeadConversionQuery extends LeadConversionQuery {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly eventRepository: EventRepository,
  ) {
    super();
  }

  async validateForApproval(
    tenantId: string,
    leadId: string,
  ): Promise<Result<LeadConversionContext>> {
    const lead = await this.leadRepository.findById(tenantId, leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (!lead.customerId) {
      return failure(
        'EP1-AUT-006',
        'Lead must be linked to a customer before approval.',
        { leadId },
      );
    }

    const quotation = await this.quotationRepository.findLatestByLeadId(
      tenantId,
      leadId,
    );

    if (!quotation) {
      return failure(
        'EP1-AUT-006',
        'An approved quotation linked to this lead is required.',
        { leadId },
      );
    }

    if (quotation.status !== 'approved') {
      return failure(
        'EP1-AUT-006',
        'Latest quotation for this lead must be approved.',
        { quotationId: quotation.id, status: quotation.status },
      );
    }

    if (quotation.customerId !== lead.customerId) {
      return failure(
        'EP1-AUT-006',
        'Quotation customer must match the lead customer.',
        {
          leadCustomerId: lead.customerId,
          quotationCustomerId: quotation.customerId,
        },
      );
    }

    const event =
      (await this.eventRepository.findByLeadId(tenantId, leadId)) ??
      (await this.eventRepository.findByQuotationId(tenantId, quotation.id));

    if (!event) {
      return failure(
        'EP1-AUT-006',
        'An approved booking (event) must exist for the quotation chain.',
        { quotationId: quotation.id },
      );
    }

    return success({
      customerId: lead.customerId,
      quotationId: quotation.id,
      eventId: event.id,
    });
  }
}
