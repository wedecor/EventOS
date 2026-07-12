import { Injectable } from '@nestjs/common';
import type { Vendor } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateVendorData,
  FindVendorsFilter,
  UpdateVendorData,
  VendorRecord,
  VendorRepository,
} from '../../domain/repositories/vendor.repository';

@Injectable()
export class VendorRepositoryImpl
  extends TenantScopedRepository
  implements VendorRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateVendorData,
  ): Promise<VendorRecord> {
    const vendor = await this.prisma.vendor.create({
      data: {
        tenant: { connect: { id: tenantId } },
        name: data.name,
        category: data.category,
        status: data.status,
        contactName: data.contactName ?? null,
        contactPhone: data.contactPhone ?? null,
        location: data.location ?? null,
        servicesProvided: data.servicesProvided ?? null,
        pricingNotes: data.pricingNotes ?? null,
        paymentTerms: data.paymentTerms ?? null,
        taxDetails: data.taxDetails ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.mapRecord(vendor);
  }

  async findById(tenantId: string, id: string): Promise<VendorRecord | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, tenantId },
    });

    return vendor ? this.mapRecord(vendor) : null;
  }

  async findMany(
    tenantId: string,
    filter?: FindVendorsFilter,
  ): Promise<VendorRecord[]> {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        tenantId,
        status: filter?.status,
        category: filter?.category,
      },
      orderBy: { createdAt: 'asc' },
    });

    return vendors.map((vendor) => this.mapRecord(vendor));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateVendorData,
    version: number,
  ): Promise<VendorRecord> {
    try {
      const vendor = await this.prisma.vendor.update({
        where: { id, tenantId, version },
        data: {
          name: data.name,
          category: data.category,
          status: data.status,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          location: data.location,
          servicesProvided: data.servicesProvided,
          pricingNotes: data.pricingNotes,
          paymentTerms: data.paymentTerms,
          taxDetails: data.taxDetails,
          notes: data.notes,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(vendor);
    } catch (error: unknown) {
      return this.toConcurrentModification('Vendor', id, error);
    }
  }

  private mapRecord(vendor: Vendor): VendorRecord {
    return {
      id: vendor.id,
      tenantId: vendor.tenantId,
      name: vendor.name,
      category: vendor.category,
      status: vendor.status,
      contactName: vendor.contactName,
      contactPhone: vendor.contactPhone,
      location: vendor.location,
      servicesProvided: vendor.servicesProvided,
      pricingNotes: vendor.pricingNotes,
      paymentTerms: vendor.paymentTerms,
      taxDetails: vendor.taxDetails,
      notes: vendor.notes,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
      version: vendor.version,
    };
  }
}
