import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../../infrastructure/jwt.strategy';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * ADR-008 — enforces a valid `Authorization: Bearer <access_token>` on every route
 * except those marked with {@link Public}. Registered globally (APP_GUARD) so the
 * API defaults to authenticated; opt-out is explicit per endpoint.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
