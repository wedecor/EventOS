import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

type RequestWithId = Request & { id?: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();
    // R2-07 — prefer pino-http / genReqId value so error envelopes match log lines.
    const requestId =
      typeof request.id === 'string' && request.id.length > 0
        ? request.id
        : randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // R2-06 — report server errors only; 4xx are client/contract failures.
      if (status >= 500) {
        Sentry.captureException(exception);
      }

      response.status(status).json({
        error: {
          code:
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'code' in exceptionResponse
              ? String((exceptionResponse as { code: string }).code)
              : 'HTTP_ERROR',
          message:
            typeof exceptionResponse === 'string'
              ? exceptionResponse
              : typeof exceptionResponse === 'object' &&
                  exceptionResponse !== null &&
                  'message' in exceptionResponse
                ? String((exceptionResponse as { message: string }).message)
                : exception.message,
          details:
            typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'details' in exceptionResponse
              ? exceptionResponse.details
              : [],
          requestId,
          path: request.url,
        },
      });
      return;
    }

    // Unexpected non-HTTP failures → 500 + Sentry (no-op when DSN absent).
    Sentry.captureException(exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        details: [],
        requestId,
        path: request.url,
      },
    });
  }
}
