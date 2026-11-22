import {
  Injectable,
  Logger,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { EnquiriesSignatureService } from '../../application/services/enquiries-signature.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

/**
 * Authenticates `POST /integrations/enquiries/sync` by HMAC signature (the route
 * is `@Public()` — there is no user JWT). Failures are always a generic 401 so
 * the response never reveals which check failed; the reason is only logged.
 */
@Injectable()
export class EnquiriesSignatureGuard implements CanActivate {
  private readonly logger = new Logger(EnquiriesSignatureGuard.name);

  constructor(private readonly signatureService: EnquiriesSignatureService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest>();

    const result = this.signatureService.verify({
      timestamp: header(request, 'x-eventos-timestamp'),
      signature: header(request, 'x-eventos-signature'),
      rawBody: request.rawBody,
    });

    if (!result.ok) {
      this.logger.warn(
        `Rejected Enquiries feed request (reason=${result.reason}, ip=${request.ip ?? 'unknown'})`,
      );
      throw new UnauthorizedException({
        code: 'INVALID_SIGNATURE',
        message: 'Invalid or missing request signature.',
        details: [],
      });
    }

    return true;
  }
}

function header(request: Request, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}
