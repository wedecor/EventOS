import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { AllExceptionsFilter } from './all-exceptions.filter';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

function createHost(
  path = '/api/v1/example',
  requestId?: string,
): {
  host: ArgumentsHost;
  response: { status: jest.Mock; json: jest.Mock };
} {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const request = {
    url: path,
    ...(requestId !== undefined ? { id: requestId } : {}),
  } as Request & { id?: string };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response as unknown as Response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;

  return { host, response };
}

describe('AllExceptionsFilter — Sentry capture (R2-06)', () => {
  const filter = new AllExceptionsFilter();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not report client HttpExceptions (4xx) to Sentry', () => {
    const { host, response } = createHost();

    filter.catch(new NotFoundException('missing'), host);

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it('reports server HttpExceptions (5xx) to Sentry', () => {
    const { host } = createHost();
    const exception = new HttpException(
      'boom',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    filter.catch(exception, host);

    expect(Sentry.captureException).toHaveBeenCalledWith(exception);
  });

  it('reports unexpected non-HTTP errors to Sentry and returns INTERNAL_ERROR', () => {
    const { host, response } = createHost('/api/v1/leads');
    const error = new Error('unexpected');

    filter.catch(error, host);

    expect(Sentry.captureException).toHaveBeenCalledWith(error);
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          path: '/api/v1/leads',
        }),
      }),
    );
  });

  it('reuses pino-http request id in the error envelope (R2-07)', () => {
    const { host, response } = createHost('/api/v1/leads', 'corr-from-pino');
    const error = new Error('unexpected');

    filter.catch(error, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          requestId: 'corr-from-pino',
        }),
      }),
    );
  });
});
