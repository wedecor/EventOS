import { Writable } from 'node:stream';
import pino from 'pino';
import { LOG_REDACT_CONFIG } from './app.module';

/**
 * R1-03 — verifies the redact configuration wired into the global
 * `LoggerModule.forRoot({ pinoHttp: { redact: LOG_REDACT_CONFIG } })` call
 * in `app.module.ts` actually strips credentials from log output.
 *
 * Exercises the real `pino` redact engine (fast-redact) with the exact
 * exported config against object shapes matching pino-http's default
 * request/response serializers, so this test fails if the paths in
 * `LOG_REDACT_CONFIG` ever drift from what pino-http actually logs.
 */
function captureLogger() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  const logger = pino({ redact: LOG_REDACT_CONFIG }, stream);
  return {
    logger,
    output: () => chunks.join(''),
  };
}

describe('LOG_REDACT_CONFIG (R1-03)', () => {
  it('redacts the Authorization header from a request log line', () => {
    const { logger, output } = captureLogger();

    logger.info(
      {
        req: { headers: { authorization: 'Bearer super-secret-access-token' } },
      },
      'request completed',
    );

    expect(output()).not.toContain('super-secret-access-token');
    expect(output()).toContain('[Redacted]');
  });

  it('redacts the Cookie header from a request log line', () => {
    const { logger, output } = captureLogger();

    logger.info(
      {
        req: {
          headers: { cookie: 'refreshToken=session-1.raw-refresh-secret' },
        },
      },
      'request completed',
    );

    expect(output()).not.toContain('session-1.raw-refresh-secret');
    expect(output()).toContain('[Redacted]');
  });

  it('redacts the Set-Cookie header from a response log line', () => {
    const { logger, output } = captureLogger();

    logger.info(
      {
        res: {
          headers: {
            'set-cookie':
              'refreshToken=session-1.raw-refresh-secret; HttpOnly; Secure',
          },
        },
      },
      'request completed',
    );

    expect(output()).not.toContain('session-1.raw-refresh-secret');
    expect(output()).toContain('[Redacted]');
  });

  it('redacts an array-valued Set-Cookie header', () => {
    const { logger, output } = captureLogger();

    logger.info(
      {
        res: {
          headers: {
            'set-cookie': [
              'refreshToken=session-1.raw-refresh-secret; HttpOnly',
              'other=irrelevant',
            ],
          },
        },
      },
      'request completed',
    );

    expect(output()).not.toContain('session-1.raw-refresh-secret');
  });

  it('does not redact unrelated headers, preserving log usefulness', () => {
    const { logger, output } = captureLogger();

    logger.info(
      {
        req: {
          method: 'GET',
          url: '/api/v1/leads',
          headers: {
            authorization: 'Bearer secret',
            'content-type': 'application/json',
          },
        },
      },
      'request completed',
    );

    expect(output()).toContain('/api/v1/leads');
    expect(output()).toContain('application/json');
    expect(output()).not.toContain('Bearer secret');
  });

  it('leaves logs without sensitive headers unaffected', () => {
    const { logger, output } = captureLogger();

    logger.info(
      { req: { method: 'GET', url: '/health' } },
      'request completed',
    );

    expect(output()).toContain('/health');
    expect(output()).not.toContain('[Redacted]');
  });
});
