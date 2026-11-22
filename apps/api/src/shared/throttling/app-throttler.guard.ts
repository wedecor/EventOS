import {
  HttpException,
  HttpStatus,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

const THROTTLER_LIMIT_METADATA = 'THROTTLER:LIMIT';

type RequestWithUser = {
  ip?: string;
  user?: { userId?: string };
};

/**
 * Global rate-limit guard (M5-01, docs/14).
 *
 * - Tracker: authenticated user id when present, otherwise the client IP. Must
 *   be registered AFTER the JWT guard so `req.user` is populated.
 * - Default limits are shared across all routes per tracker. Routes that
 *   declare their own `@Throttle({ default: … })` get an independent counter.
 * - 429 uses the standard `{ code: 'RATE_LIMITED' }` envelope + `Retry-After`.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const request = req as RequestWithUser;
    if (request.user?.userId) {
      return Promise.resolve(`user:${request.user.userId}`);
    }
    return Promise.resolve(`ip:${request.ip ?? 'unknown'}`);
  }

  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const overridden = this.reflector.getAllAndOverride<unknown>(
      `${THROTTLER_LIMIT_METADATA}${name}`,
      [context.getHandler(), context.getClass()],
    );
    if (overridden === undefined || overridden === null) {
      return `${name}:${suffix}`;
    }
    return `${name}:${context.getClass().name}.${context.getHandler().name}:${suffix}`;
  }

  protected throwThrottlingException(
    _context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    return Promise.reject(
      new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          details: { retryAfterSeconds: detail.timeToBlockExpire },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );
  }
}
