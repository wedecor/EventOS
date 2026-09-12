import { Injectable } from '@nestjs/common';
import type { Contact } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ContactRepository,
  type CreateContactData,
  type ContactRecord,
} from '../../domain/repositories/contact.repository';

@Injectable()
export class ContactRepositoryImpl implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: CreateContactData,
  ): Promise<ContactRecord> {
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        customerId: data.customerId,
        name: data.name,
        role: data.role ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        isPrimary: data.isPrimary ?? false,
      },
    });

    return this.map(contact);
  }

  async countByCustomer(tenantId: string, customerId: string): Promise<number> {
    return this.prisma.contact.count({
      where: { tenantId, customerId },
    });
  }

  private map(contact: Contact): ContactRecord {
    return {
      id: contact.id,
      tenantId: contact.tenantId,
      customerId: contact.customerId,
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      email: contact.email,
      isPrimary: contact.isPrimary,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
      version: contact.version,
    };
  }
}
