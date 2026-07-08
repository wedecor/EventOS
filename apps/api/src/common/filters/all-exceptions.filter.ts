import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

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
