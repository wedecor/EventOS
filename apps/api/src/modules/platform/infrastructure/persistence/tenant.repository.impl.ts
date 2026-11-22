import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  TenantRepository,
  type TenantRecord,
} from '../../domain/repositories/tenant.repository';

@Injectable()
export class TenantRepositoryImpl implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<TenantRecord | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      return null;
    }

    return { id: tenant.id, name: tenant.name, slug: tenant.slug };
  }

  async findById(id: string): Promise<TenantRecord | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      return null;
    }

    return { id: tenant.id, name: tenant.name, slug: tenant.slug };
  }
}
