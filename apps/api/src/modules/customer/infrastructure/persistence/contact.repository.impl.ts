import { Injectable } from '@nestjs/common';
import type { Contact } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  ContactRecord,
  ContactRepository,
  CreateContactData,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class ContactRepositoryImpl
  extends TenantScopedRepository
  implements ContactRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateContactData,
  ): Promise<ContactRecord> {
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        customerId: data.customerId,
        name: data.name,
        role: data.role,
        phone: data.phone ?? null,
        email: data.email ?? null,
      },
    });

    return this.mapRecord(contact);
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<ContactRecord[]> {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map((contact) => this.mapRecord(contact));
  }

  async countByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<number> {
    return this.prisma.contact.count({
      where: { tenantId, customerId },
    });
  }

  private mapRecord(contact: Contact): ContactRecord {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      customerId: contact.customerId,
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      createdAt: contact.createdAt,
    };
  }
}
