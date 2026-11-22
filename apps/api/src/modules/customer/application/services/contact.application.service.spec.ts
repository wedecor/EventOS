import { ContactAddedEvent } from '../../../../shared/events/sprint1-domain.events';
import type { CustomerRecord } from '../../domain/repositories/customer.repository';
import type { ContactRecord } from '../../domain/repositories/contact.repository';
import { ContactApplicationService } from './contact.application.service';

describe('ContactApplicationService', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';

  const customer: CustomerRecord = {
    id: customerId,
    tenantId,
    displayName: 'Acme Corp',
    type: 'organization',
    status: 'active',
    primaryPhone: '+919876543210',
    primaryEmail: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const contact: ContactRecord = {
    id: 'contact-1',
    tenantId,
    customerId,
    name: 'Priya Sharma',
    role: 'bride',
    phone: '+919876543210',
    email: 'priya@example.com',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let contactRepository: {
    create: jest.Mock;
    findByCustomerId: jest.Mock;
    countByCustomerId: jest.Mock;
  };
  let customerRepository: { findById: jest.Mock };
  let publish: jest.Mock;
  let service: ContactApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    contactRepository = {
      create: jest.fn(),
      findByCustomerId: jest.fn(),
      countByCustomerId: jest.fn(),
    };
    customerRepository = { findById: jest.fn() };

    service = new ContactApplicationService(
      contactRepository,
      customerRepository as never,
      { publish },
    );
  });

  it('addContact returns NOT_FOUND when customer missing', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.addContact(tenantId, customerId, {
      name: 'Priya',
      role: 'bride',
      phone: '+919876543210',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addContact rejects blank name', async () => {
    customerRepository.findById.mockResolvedValue(customer);

    const result = await service.addContact(tenantId, customerId, {
      name: '   ',
      role: 'bride',
      phone: '+919876543210',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('addContact rejects when neither phone nor email provided', async () => {
    customerRepository.findById.mockResolvedValue(customer);

    const result = await service.addContact(tenantId, customerId, {
      name: 'Priya',
      role: 'bride',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('addContact returns docs/09 shape and publishes ContactAdded', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    contactRepository.create.mockResolvedValue(contact);
    contactRepository.countByCustomerId.mockResolvedValue(2);

    const result = await service.addContact(tenantId, customerId, {
      name: ' Priya Sharma ',
      role: ' bride ',
      phone: '+919876543210',
      email: 'Priya@Example.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ id: contact.id, contactsCount: 2 });
    }
    expect(contactRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        name: 'Priya Sharma',
        role: 'bride',
        email: 'priya@example.com',
      }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(ContactAddedEvent));
  });

  it('addContact does not touch customer primary fields (decision 5A)', async () => {
    customerRepository.findById.mockResolvedValue(customer);
    contactRepository.create.mockResolvedValue(contact);
    contactRepository.countByCustomerId.mockResolvedValue(1);

    await service.addContact(tenantId, customerId, {
      name: 'Priya',
      role: 'bride',
      phone: '+919999999999',
    });

    expect(customerRepository.findById).toHaveBeenCalledTimes(1);
    expect(Object.keys(customerRepository)).toEqual(['findById']);
  });
});
