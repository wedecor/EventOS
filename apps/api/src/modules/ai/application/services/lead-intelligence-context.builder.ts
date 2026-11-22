import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import {
  LEAD_INTELLIGENCE_BODY_TRUNCATE,
  LEAD_INTELLIGENCE_COMMUNICATION_LIMIT,
} from '../lead-intelligence.constants';

export type LeadIntelligenceAuthorizedContext = {
  lead: {
    id: string;
    stage: string;
    source: string;
    sourceDetail: string | null;
    eventType: string | null;
    eventStartDate: string | null;
    eventEndDate: string | null;
    venue: string | null;
    estimatedBudgetAmount: number | null;
    estimatedBudgetCurrency: string;
    guestCount: number | null;
    /** Untrusted free text — also echoed under untrusted wrapper in prompt. */
    notes: string | null;
  };
  customer: {
    id: string;
    displayName: string;
    type: string;
    status: string;
    hasPhone: boolean;
    hasEmail: boolean;
  } | null;
  communications: Array<{
    id: string;
    channel: string;
    direction: string;
    status: string;
    occurredAt: string;
    subject: string | null;
    /** Truncated untrusted body. */
    bodyPreview: string | null;
  }>;
  meta: {
    communicationLimit: number;
    communicationCountIncluded: number;
    promptSafety: {
      customerFreeTextIsUntrusted: true;
      noToolAccess: true;
    };
  };
};

@Injectable()
export class LeadIntelligenceContextBuilder {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
  ) {}

  /**
   * Loads tenant-scoped lead context. Never trusts leadId without findById(tenantId, id).
   * Does not expose phone/email plaintext — only presence flags for qualification.
   */
  async build(
    tenantId: string,
    leadId: string,
  ): Promise<Result<LeadIntelligenceAuthorizedContext>> {
    const lead = await this.leadRepository.findById(tenantId, leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    let customer: LeadIntelligenceAuthorizedContext['customer'] = null;
    if (lead.customerId) {
      const record = await this.customerRepository.findById(
        tenantId,
        lead.customerId,
      );
      if (record) {
        customer = {
          id: record.id,
          displayName: record.displayName,
          type: record.type,
          status: record.status,
          hasPhone: Boolean(record.primaryPhone?.trim()),
          hasEmail: Boolean(record.primaryEmail?.trim()),
        };
      }
    }

    const communications =
      await this.communicationRecordRepository.findByLeadId(tenantId, leadId);
    const bounded = communications.slice(
      0,
      LEAD_INTELLIGENCE_COMMUNICATION_LIMIT,
    );

    return success({
      lead: {
        id: lead.id,
        stage: lead.stage,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        eventType: lead.eventType,
        eventStartDate: lead.eventStartDate
          ? lead.eventStartDate.toISOString().slice(0, 10)
          : null,
        eventEndDate: lead.eventEndDate
          ? lead.eventEndDate.toISOString().slice(0, 10)
          : null,
        venue: lead.venue,
        estimatedBudgetAmount: lead.estimatedBudgetAmount,
        estimatedBudgetCurrency: lead.estimatedBudgetCurrency,
        guestCount: lead.guestCount,
        notes: lead.notes,
      },
      customer,
      communications: bounded.map((row) => ({
        id: row.id,
        channel: row.channel,
        direction: row.direction,
        status: row.status,
        occurredAt: row.occurredAt.toISOString(),
        subject: row.subject,
        bodyPreview: truncateUntrusted(row.body),
      })),
      meta: {
        communicationLimit: LEAD_INTELLIGENCE_COMMUNICATION_LIMIT,
        communicationCountIncluded: bounded.length,
        promptSafety: {
          customerFreeTextIsUntrusted: true,
          noToolAccess: true,
        },
      },
    });
  }
}

function truncateUntrusted(body: string | null): string | null {
  if (body == null) return null;
  if (body.length <= LEAD_INTELLIGENCE_BODY_TRUNCATE) {
    return wrapUntrusted(body);
  }
  return wrapUntrusted(
    `${body.slice(0, LEAD_INTELLIGENCE_BODY_TRUNCATE)}…[truncated]`,
  );
}

function wrapUntrusted(text: string): string {
  return `<untrusted_customer_content>${text}</untrusted_customer_content>`;
}
