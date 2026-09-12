import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ContactAddedEvent,
  CustomerCreatedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import {
  ContactRepository,
  type CreateContactData,
} from '../../domain/repositories/contact.repository';
import {
  CustomerRepository,
  type CreateCustomerData,
  type UpdateCustomerData,
} from '../../domain/repositories/customer.repository';
import { toCustomerDto, type CustomerDto } from '../dtos/customer.dto';

export type CreateCustomerInput = CreateCustomerData;
export type UpdateCustomerInput = UpdateCustomerData;

export type FindExistingCustomerInput = {
  phone?: string;
  displayName?: string;
};

export type AddContactInput = Omit<CreateContactData, 'customerId'> & {
  phone?: { countryCode: string; number: string } | null;
  email?: { value: string } | null;
};

export type AddContactResult = {
  id: string;
  contactsCount: number;
};

@Injectable()
export class CustomerApplicationService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly contactRepository: ContactRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async listCustomers(tenantId: string): Promise<Result<CustomerDto[]>> {
    const customers = await this.customerRepository.listAll(tenantId);
    return success(customers.map(toCustomerDto));
  }

  async getCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );

    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    return success(toCustomerDto(customer));
  }

  async createCustomer(
    tenantId: string,
    input: CreateCustomerInput,
  ): Promise<Result<CustomerDto>> {
    if (!input.displayName.trim()) {
      return failure('VALIDATION_ERROR', 'Customer display name is required.');
    }

    if (!input.primaryPhone?.trim() && !input.primaryEmail?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Customer must have at least one phone or email contact.',
      );
    }

    const existing = await this.findExistingCustomer(tenantId, {
      phone: input.primaryPhone ?? undefined,
      displayName: input.displayName,
    });
    if (existing.ok && existing.value) {
      return failure(
        'DUPLICATE_CUSTOMER',
        'An existing customer matches the provided identity.',
        { customerId: existing.value.id },
      );
    }

    const customer = await this.customerRepository.create(tenantId, input);
    this.eventPublisher.publish(new CustomerCreatedEvent(tenantId, customer));

    return success(toCustomerDto(customer));
  }

  async getCustomerById(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    return success(toCustomerDto(customer));
  }

  async updateCustomer(
    tenantId: string,
    customerId: string,
    input: UpdateCustomerInput,
    version: number,
  ): Promise<Result<CustomerDto>> {
    const existing = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    if (input.displayName !== undefined && !input.displayName.trim()) {
      return failure('VALIDATION_ERROR', 'Customer display name is required.');
    }

    const nextPhone = input.primaryPhone ?? existing.primaryPhone;
    const nextEmail = input.primaryEmail ?? existing.primaryEmail;
    if (!nextPhone?.trim() && !nextEmail?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Customer must retain at least one phone or email contact.',
      );
    }

    try {
      const customer = await this.customerRepository.update(
        tenantId,
        customerId,
        input,
        version,
      );
      return success(toCustomerDto(customer));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Customer was modified by another request. Reload and retry.',
          { customerId },
        );
      }
      throw error;
    }
  }

  async findExistingCustomer(
    tenantId: string,
    input: FindExistingCustomerInput,
  ): Promise<Result<CustomerDto | null>> {
    if (input.phone?.trim()) {
      const matches = await this.customerRepository.findByPhone(
        tenantId,
        input.phone.trim(),
      );
      if (matches.length > 0) {
        return success(toCustomerDto(matches[0]));
      }
    }

    if (input.displayName?.trim()) {
      const match = await this.customerRepository.findByDisplayName(
        tenantId,
        input.displayName.trim(),
      );
      if (match) {
        return success(toCustomerDto(match));
      }
    }

    return success(null);
  }

  async addContact(
    tenantId: string,
    customerId: string,
    input: AddContactInput,
  ): Promise<Result<AddContactResult>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    if (!input.name.trim()) {
      return failure('VALIDATION_ERROR', 'Contact name is required.');
    }

    const phone = normalizeContactPhone(input.phone);
    const email = input.email?.value?.trim().toLowerCase() ?? null;

    if (!phone && !email) {
      return failure(
        'VALIDATION_ERROR',
        'Contact must have at least one phone or email.',
      );
    }

    const contact = await this.contactRepository.create(tenantId, {
      customerId,
      name: input.name.trim(),
      role: input.role?.trim() ?? null,
      phone,
      email,
    });

    const contactsCount = await this.contactRepository.countByCustomer(
      tenantId,
      customerId,
    );

    this.eventPublisher.publish(
      new ContactAddedEvent(tenantId, contact, customerId),
    );

    return success({ id: contact.id, contactsCount });
  }
}

function normalizeContactPhone(phone: AddContactInput['phone']): string | null {
  if (!phone) {
    return null;
  }

  const countryCode = phone.countryCode.trim();
  const number = phone.number.trim().replace(/\s+/g, '');
  if (!countryCode || !number) {
    return null;
  }

  return `${countryCode}${number}`;
}
