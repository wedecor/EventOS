import { HttpException, HttpStatus } from '@nestjs/common';

import type { ApplicationError, Result } from '../application/result';

const ERROR_CODE_TO_STATUS: Record<string, HttpStatus> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  CONCURRENT_MODIFICATION: HttpStatus.CONFLICT,
  INVALID_STATE: HttpStatus.CONFLICT,
  INVALID_TRANSITION: HttpStatus.CONFLICT,
  DUPLICATE_CUSTOMER: HttpStatus.CONFLICT,
  DUPLICATE_EVENT: HttpStatus.CONFLICT,
  'EP1-BR-001': HttpStatus.UNPROCESSABLE_ENTITY,
  'EP1-BR-002': HttpStatus.UNPROCESSABLE_ENTITY,
  'EP1-BR-003': HttpStatus.UNPROCESSABLE_ENTITY,
};

function toHttpStatus(code: string): HttpStatus {
  return ERROR_CODE_TO_STATUS[code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
}

function throwHttpException(error: ApplicationError): never {
  const status = toHttpStatus(error.code);

  throw new HttpException(
    {
      code: error.code,
      message: error.message,
      details: error.details,
    },
    status,
  );
}

/**
 * Converts a Result<T> into an HTTP response envelope.
 *
 * On success, returns `{ data: T }`.
 * On failure, throws an HttpException with the appropriate status code
 * so AllExceptionsFilter can format the error envelope.
 */
export function resultToResponse<T>(
  result: Result<T>,
  successStatus?: number,
): { data: T } {
  if (!result.ok) {
    throwHttpException(result.error);
  }

  // successStatus is available for controllers that need 201, etc.
  // The actual status is set via @HttpCode or @Post() defaults;
  // this parameter is reserved for future middleware integration.
  void successStatus;

  return { data: result.value };
}
