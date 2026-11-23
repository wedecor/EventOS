import {
  BadRequestException,
  Injectable,
  Logger,
  PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Zod request validation pipe (ADR-013).
 * Apply per-route with `@Body(new ZodValidationPipe(schema))` (and similarly for query/params).
 * 400 `details` are `{ path, message }` only — never raw values.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      this.logger.warn('request_validation_failed', { details });
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details,
      });
    }

    return parsed.data;
  }
}
