import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Extracts the version number from the `If-Match` header.
 *
 * Expected header format: `"<version>"` (a number wrapped in double quotes).
 * Returns the parsed number, or undefined if the header is absent or unparseable.
 */
export const IfMatchVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers['if-match'];

    if (typeof header !== 'string') {
      return undefined;
    }

    // Strip surrounding quotes: "123" → 123
    const stripped = header.replace(/^"|"$/g, '');
    const version = Number(stripped);

    if (Number.isNaN(version) || !Number.isInteger(version)) {
      return undefined;
    }

    return version;
  },
);
