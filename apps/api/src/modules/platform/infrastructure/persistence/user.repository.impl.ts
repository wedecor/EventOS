import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  UserRepository,
  type UserRecord,
} from '../../domain/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantAndEmail(
    tenantId: string,
    email: string,
  ): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase(),
        },
      },
    });

    return user ? this.map(user) : null;
  }

  async findById(tenantId: string, id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    return user ? this.map(user) : null;
  }

  private map(user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string | null;
    version: number;
  }): UserRecord {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: user.passwordHash,
      version: user.version,
    };
  }
}
