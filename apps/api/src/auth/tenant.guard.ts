import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { TenantRepository } from '../modules/platform/domain/repositories/tenant.repository';
import { TenantContext } from './tenant.context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly tenantContext: TenantContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const slug =
      (request.headers['x-tenant-slug'] as string | undefined)?.trim() ||
      process.env.DEV_TENANT_SLUG?.trim() ||
      'we-decor';

    const tenant = await this.tenantRepository.findBySlug(slug);

    if (!tenant) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Unknown tenant context.',
        details: { slug },
      });
    }

    this.tenantContext.setTenantId(tenant.id);
    return true;
  }
}
