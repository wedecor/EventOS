import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as publicly accessible, exempting it from the
 * globally-registered {@link JwtAuthGuard}. Use only for endpoints that cannot
 * require a token (login, refresh) or infrastructure probes (health).
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
