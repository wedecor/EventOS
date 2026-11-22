import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/authenticated-user';

/**
 * Resolves the authenticated identity attached to the request by the JWT strategy.
 * Only valid on routes protected by {@link JwtAuthGuard}; on public routes the
 * request has no user and this returns `undefined`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser | undefined;
  },
);
