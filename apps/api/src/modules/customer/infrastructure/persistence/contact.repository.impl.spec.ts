import { PrismaService } from '../../../../database/prisma.service';
import { ContactRepositoryImpl } from './contact.repository.impl';

describe('ContactRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const customerId = 'customer-1';

  const prismaContact = {
    id: 'contact-1',
    tenantId,
    customerId,
    name: 'Priya Sharma',
    role: 'bride',
    phone: '+919876543210',
    email: 'priya@example.com',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let prisma: {
    contact: {
      create: jest.Mock;
      count: jest.Mock;
    };
  };
  let repository: ContactRepositoryImpl;

  beforeEach(() => {
    prisma = {
      contact: {
        create: jest.fn(),
        count: jest.fn(),
      },
    };
    repository = new ContactRepositoryImpl(prisma as unknown as PrismaService);
  });

  it('create persists contact without version', async () => {
    prisma.contact.create.mockResolvedValue(prismaContact);

    const result = await repository.create(tenantId, {
      customerId,
      name: 'Priya Sharma',
      role: 'bride',
      phone: '+919876543210',
      email: 'priya@example.com',
    });

    expect(prisma.contact.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        customerId,
        name: 'Priya Sharma',
        role: 'bride',
        phone: '+919876543210',
        email: 'priya@example.com',
      },
    });
    expect(result.id).toBe(prismaContact.id);
    expect(result).not.toHaveProperty('version');
  });

  it('countByCustomerId scopes by tenant and customer', async () => {
    prisma.contact.count.mockResolvedValue(3);

    const result = await repository.countByCustomerId(tenantId, customerId);

    expect(prisma.contact.count).toHaveBeenCalledWith({
      where: { tenantId, customerId },
    });
    expect(result).toBe(3);
  });
});
