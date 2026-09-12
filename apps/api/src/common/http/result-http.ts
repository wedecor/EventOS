import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ApplicationError, Result } from '../../shared/application/result';

const CODE_TO_STATUS: Record<
  string,
  (error: ApplicationError) => HttpException
> = {
  NOT_FOUND: (error) =>
    new NotFoundException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  VALIDATION_ERROR: (error) =>
    new BadRequestException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  INVALID_STATE: (error) =>
    new UnprocessableEntityException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  INVALID_TRANSITION: (error) =>
    new UnprocessableEntityException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  DUPLICATE_CUSTOMER: (error) =>
    new ConflictException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  DUPLICATE_EVENT: (error) =>
    new ConflictException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  CONCURRENT_MODIFICATION: (error) =>
    new ConflictException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
  'EP1-BR-001': (error) =>
    new UnprocessableEntityException({
      code: error.code,
      message: error.message,
      details: error.details ?? [],
    }),
};

export function unwrapResult<T>(result: Result<T>): T {
  if (result.ok) {
    return result.value;
  }

  const mapper =
    CODE_TO_STATUS[result.error.code] ??
    ((error: ApplicationError) =>
      new UnprocessableEntityException({
        code: error.code,
        message: error.message,
        details: error.details ?? [],
      }));

  throw mapper(result.error);
}

export function parseIfMatchVersion(ifMatchHeader?: string): number {
  if (!ifMatchHeader?.trim()) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'If-Match header with aggregate version is required.',
      details: [],
    });
  }

  const raw = ifMatchHeader.replace(/"/g, '').trim();
  const version = Number.parseInt(raw, 10);

  if (!Number.isFinite(version) || version < 1) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'If-Match must be a positive integer version.',
      details: [],
    });
  }

  return version;
}
