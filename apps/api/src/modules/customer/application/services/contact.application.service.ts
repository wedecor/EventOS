import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { ContactAddedEvent } from '../../../../shared/events/sprint1-domain.events';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import type { AddContactResultDto } from '../dtos/contact.dto';

export type AddContactInput = {
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
};

// R3-06 / EP1-CUS-001 — Add owned Contact under Customer.
// docs/09 §Customer POST /clients/:id/contacts. ADR-016 tenant scoping.
// Decision 5A: does not mutate Customer.primaryPhone / primaryEmail.
@Injectable()
export class ContactApplicationService {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async addContact(
    tenantId: string,
    customerId: string,
    input: AddContactInput,
  ): Promise<Result<AddContactResultDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const name = input.name.trim();
    const role = input.role.trim();
    if (!name) {
      return failure('VALIDATION_ERROR', 'Contact name cannot be blank.');
    }
    if (!role) {
      return failure('VALIDATION_ERROR', 'Contact role cannot be blank.');
    }

    const phone = input.phone?.trim() || null;
    const email = input.email?.trim().toLowerCase() || null;
    if (!phone && !email) {
      return failure(
        'VALIDATION_ERROR',
        'Contact must have at least one phone or email.',
      );
    }

    const contact = await this.contactRepository.create(tenantId, {
      customerId,
      name,
      role,
      phone,
      email,
    });

    const contactsCount = await this.contactRepository.countByCustomerId(
      tenantId,
      customerId,
    );

    this.eventPublisher.publish(new ContactAddedEvent(tenantId, contact));

    return success({ id: contact.id, contactsCount });
  }
}
