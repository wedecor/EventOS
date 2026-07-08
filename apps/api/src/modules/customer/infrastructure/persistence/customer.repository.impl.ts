import { Injectable } from '@nestjs/common';
import type { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateCustomerData,
  CustomerRecord,
  CustomerRepository,
  UpdateCustomerData,
} from '../../domain/repositories/customer.repository';

@Injectable()
export class CustomerRepositoryImpl
  extends TenantScopedRepository
  implements CustomerRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateCustomerData,
  ): Promise<CustomerRecord> {
    const customer = await this.prisma.customer.create({
      data: {
        tenant: { connect: { id: tenantId } },
        displayName: data.displayName,
        type: data.type ?? 'individual',
        status: data.status ?? 'active',
        primaryPhone: data.primaryPhone ?? null,
        primaryEmail: data.primaryEmail ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.mapCustomer(customer);
  }

  async findById(tenantId: string, id: string): Promise<CustomerRecord | null> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    return customer ? this.mapCustomer(customer) : null;
  }

  async findByPhone(
    tenantId: string,
    phone: string,
  ): Promise<CustomerRecord[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId, primaryPhone: phone },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((customer) => this.mapCustomer(customer));
  }

  async findByDisplayName(
    tenantId: string,
    displayName: string,
  ): Promise<CustomerRecord | null> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        displayName: {
          equals: displayName,
          mode: 'insensitive',
        },
      },
    });

    return customer ? this.mapCustomer(customer) : null;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateCustomerData,
    version: number,
  ): Promise<CustomerRecord> {
    try {
      const customer = await this.prisma.customer.update({
        where: { id, tenantId, version },
        data: {
          ...this.toUpdateInput(data),
          version: { increment: 1 },
        },
      });

      return this.mapCustomer(customer);
    } catch (error: unknown) {
      return this.toConcurrentModification('Customer', id, error);
    }
  }

  private toUpdateInput(data: UpdateCustomerData): Prisma.CustomerUpdateInput {
    return {
      displayName: data.displayName,
      type: data.type,
      status: data.status,
      primaryPhone: data.primaryPhone,
      primaryEmail: data.primaryEmail,
      notes: data.notes,
    };
  }

  private mapCustomer(customer: Customer): CustomerRecord {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      displayName: customer.displayName,
      type: customer.type,
      status: customer.status,
      primaryPhone: customer.primaryPhone,
      primaryEmail: customer.primaryEmail,
      notes: customer.notes,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      version: customer.version,
    };
  }
}
