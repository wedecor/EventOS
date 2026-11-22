import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { TenantRepository } from '../modules/platform/domain/repositories/tenant.repository';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { TenantContext } from './tenant.context';
import type { AuthenticatedUser } from './jwt-payload.types';

export type RequestWithAuth = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly tenantRepository: TenantRepository,
    private readonly tenantContext: TenantContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    if (request.path === '/health' || request.path.startsWith('/health/')) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice('Bearer '.length).trim();
      const payload = this.authService.verifyAccessToken(token);
      request.user = payload;
      this.tenantContext.setTenantId(payload.tenantId);
      return true;
    }

    const nodeEnv = process.env.NODE_ENV ?? 'development';
    if (nodeEnv !== 'production') {
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

    throw new UnauthorizedException({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }
}
