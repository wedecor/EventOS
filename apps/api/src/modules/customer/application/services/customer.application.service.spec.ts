import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ContactAddedEvent,
  CustomerCreatedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { CustomerApplicationService } from './customer.application.service';
import type { ContactRepository } from '../../domain/repositories/contact.repository';
import type {
  CustomerRecord,
  CustomerRepository,
} from '../../domain/repositories/customer.repository';

describe('CustomerApplicationService', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';

  const baseCustomer: CustomerRecord = {
    id: customerId,
    tenantId,
    displayName: 'Priya Sharma',
    type: 'individual',
    status: 'active',
    primaryPhone: '+919999999999',
    primaryEmail: 'priya@example.com',
    phoneNormalized: '+919999999999',
    externalManaged: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let customerRepository: jest.Mocked<CustomerRepository>;
  let contactRepository: jest.Mocked<ContactRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: CustomerApplicationService;

  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    customerRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByPhoneNormalized: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByDisplayName: jest.fn(),
      findAll: jest.fn(),
      findPage: jest.fn(),
      update: jest.fn(),
      listAll: jest.fn(),
    };
    eventPublisher = { publish };
    contactRepository = {
      create: jest.fn(),
      findByCustomerId: jest.fn(),
      countByCustomerId: jest.fn(),
      countByCustomer: jest.fn(),
    };

    service = new CustomerApplicationService(
      customerRepository,
      contactRepository,
      eventPublisher,
    );
  });

  it('returns not found when getting a missing customer', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.getCustomerById(tenantId, customerId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('retrieves a customer by id', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);

    const result = await service.getCustomerById(tenantId, customerId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(customerId);
    }
  });

  it('rejects create when display name is empty', async () => {
    const result = await service.createCustomer(tenantId, {
      displayName: '   ',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects create when no contact is provided', async () => {
    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates a customer and publishes ClientCreated', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);
    customerRepository.create.mockResolvedValue(baseCustomer);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(true);
    expect(customerRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ phoneNormalized: '+919999999999' }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(CustomerCreatedEvent));
  });

  it('allows two customers to share a display name (M5-01)', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);
    customerRepository.findByDisplayName.mockResolvedValue(baseCustomer);
    customerRepository.create.mockResolvedValue({
      ...baseCustomer,
      id: 'customer-2',
      primaryPhone: '+918888888888',
      phoneNormalized: '+918888888888',
    });

    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+918888888888',
    });

    expect(result.ok).toBe(true);
    expect(customerRepository.findByDisplayName).not.toHaveBeenCalled();
  });

  it('rejects duplicate customers matched by normalised phone', async () => {
    customerRepository.findByPhoneNormalized.mockResolvedValue(baseCustomer);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Someone Else',
      primaryPhone: '+91 99999 99999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_CUSTOMER');
    }
  });

  it('rejects duplicate customers matched by email', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);
    customerRepository.findByEmail.mockResolvedValue(baseCustomer);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Someone Else',
      primaryEmail: 'priya@example.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_CUSTOMER');
    }
  });

  it('rejects duplicate customers during create', async () => {
    customerRepository.findByPhone.mockResolvedValue([baseCustomer]);

    const result = await service.createCustomer(tenantId, {
      displayName: 'Priya Sharma',
      primaryPhone: '+919999999999',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_CUSTOMER');
    }
  });

  it('finds an existing customer by phone', async () => {
    customerRepository.findByPhone.mockResolvedValue([baseCustomer]);

    const result = await service.findExistingCustomer(tenantId, {
      phone: '+919999999999',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe(customerId);
    }
  });

  it('finds an existing customer by email', async () => {
    customerRepository.findByEmail.mockResolvedValue(baseCustomer);

    const result = await service.findExistingCustomer(tenantId, {
      email: 'PRIYA@example.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value?.id).toBe(customerId);
    }
  });

  it('returns null when no existing customer matches', async () => {
    customerRepository.findByPhone.mockResolvedValue([]);

    const result = await service.findExistingCustomer(tenantId, {
      phone: '+910000000000',
      email: 'unknown@example.com',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeNull();
    }
  });

  it('rejects update when customer is not found', async () => {
    customerRepository.findById.mockResolvedValue(null);

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects update with empty display name', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: '   ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects update that removes all contact details', async () => {
    customerRepository.findById.mockResolvedValue({
      ...baseCustomer,
      primaryEmail: null,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { primaryPhone: '' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updates a customer with optimistic concurrency', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.update.mockResolvedValue({
      ...baseCustomer,
      displayName: 'Priya S.',
      version: 2,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(true);
  });

  it('rejects identity edits on externally managed customers with SOURCE_OWNED', async () => {
    customerRepository.findById.mockResolvedValue({
      ...baseCustomer,
      externalManaged: true,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SOURCE_OWNED');
    }
    expect(customerRepository.update).not.toHaveBeenCalled();
  });

  it('allows notes edits and unchanged identity values on externally managed customers', async () => {
    customerRepository.findById.mockResolvedValue({
      ...baseCustomer,
      externalManaged: true,
    });
    customerRepository.update.mockResolvedValue({
      ...baseCustomer,
      externalManaged: true,
      notes: 'VIP',
      version: 2,
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya Sharma', notes: 'VIP' },
      1,
    );

    expect(result.ok).toBe(true);
  });

  it('recomputes phoneNormalized on phone change and rejects clashes', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.findByPhoneNormalized.mockResolvedValue({
      ...baseCustomer,
      id: 'other-customer',
    });

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { primaryPhone: '+918888888888' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_CUSTOMER');
    }
  });

  it('stores the new normalised phone on update', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.update.mockResolvedValue({
      ...baseCustomer,
      version: 2,
    });

    await service.updateCustomer(
      tenantId,
      customerId,
      { primaryPhone: '+918888888888' },
      1,
    );

    expect(customerRepository.update).toHaveBeenCalledWith(
      tenantId,
      customerId,
      expect.objectContaining({ phoneNormalized: '+918888888888' }),
      1,
    );
  });

  it('maps concurrent modification failures on update', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    customerRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Customer', customerId),
    );

    const result = await service.updateCustomer(
      tenantId,
      customerId,
      { displayName: 'Priya S.' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('adds a contact and publishes ContactAdded', async () => {
    customerRepository.findById.mockResolvedValue(baseCustomer);
    contactRepository.create.mockResolvedValue({
      id: 'contact-1',
      tenantId,
      customerId,
      name: 'Rahul',
      role: 'groom',
      phone: '+919876543210',
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    contactRepository.countByCustomer.mockResolvedValue(+2);

    const result = await service.addContact(tenantId, customerId, {
      name: 'Rahul',
      role: 'groom',
      phone: { countryCode: '+91', number: '9876543210' },
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(ContactAddedEvent));
  });
});
