import { Writable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import {
  LOG_REDACT_CONFIG,
  LOG_SERVICE_NAME,
  buildPinoHttpOptions,
  generateRequestId,
  logCensor,
  maskPhoneForLog,
} from './logging.config';

describe('logging.config — structured JSON shipping prep (R2-07)', () => {
  describe('generateRequestId', () => {
    it('reuses a non-empty x-request-id header', () => {
      const headers: Record<string, string> = {};
      const req = {
        headers: { 'x-request-id': 'client-corr-1' },
      } as IncomingMessage;
      const res = {
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
      } as unknown as ServerResponse;

      expect(generateRequestId(req, res)).toBe('client-corr-1');
      expect(headers['x-request-id']).toBe('client-corr-1');
    });

    it('generates a UUID when the header is absent', () => {
      const headers: Record<string, string> = {};
      const req = { headers: {} } as IncomingMessage;
      const res = {
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
      } as unknown as ServerResponse;

      const id = generateRequestId(req, res);
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(headers['x-request-id']).toBe(id);
    });
  });

  describe('buildPinoHttpOptions', () => {
    it('emits JSON (no pino-pretty) for staging', () => {
      const options = buildPinoHttpOptions({
        NODE_ENV: 'staging',
        LOG_LEVEL: 'info',
      });

      expect(options.transport).toBeUndefined();
      expect(options.level).toBe('info');
      expect(options.redact).toEqual(LOG_REDACT_CONFIG);
      expect(options.genReqId).toBe(generateRequestId);
    });

    it('emits JSON (no pino-pretty) for production', () => {
      const options = buildPinoHttpOptions({ NODE_ENV: 'production' });
      expect(options.transport).toBeUndefined();
    });

    it('keeps pino-pretty for local development', () => {
      const options = buildPinoHttpOptions({ NODE_ENV: 'development' });
      expect(options.transport).toEqual({
        target: 'pino-pretty',
        options: { singleLine: true },
      });
    });

    it('attaches service + requestId via customProps for aggregators', () => {
      const options = buildPinoHttpOptions({ NODE_ENV: 'staging' });
      const props = (
        options.customProps as (req: { id: string }) => Record<string, unknown>
      )({ id: 'req-xyz' });

      expect(props).toEqual({
        service: LOG_SERVICE_NAME,
        requestId: 'req-xyz',
      });
    });
  });

  describe('LOG_REDACT_CONFIG compatibility', () => {
    it('still redacts Authorization when exercised through pino', () => {
      const chunks: string[] = [];
      const stream = new Writable({
        write(chunk: Buffer, _encoding, callback) {
          chunks.push(chunk.toString());
          callback();
        },
      });
      const logger = pino({ redact: LOG_REDACT_CONFIG }, stream);

      logger.info(
        {
          req: {
            headers: { authorization: 'Bearer super-secret-access-token' },
          },
          requestId: 'corr-1',
          service: LOG_SERVICE_NAME,
        },
        'request completed',
      );

      const output = chunks.join('');
      expect(output).not.toContain('super-secret-access-token');
      expect(output).toContain('[Redacted]');
      expect(output).toContain('corr-1');
      expect(output).toContain(LOG_SERVICE_NAME);
    });
  });

  describe('M5-01 redaction', () => {
    function capture() {
      const chunks: string[] = [];
      const stream = new Writable({
        write(chunk: Buffer, _encoding, callback) {
          chunks.push(chunk.toString());
          callback();
        },
      });
      return {
        logger: pino({ redact: LOG_REDACT_CONFIG }, stream),
        output: () => chunks.join(''),
      };
    }

    it('redacts the Enquiries feed signature header', () => {
      const { logger, output } = capture();

      logger.info(
        {
          req: {
            headers: {
              'x-eventos-signature': 'v1=deadbeefcafe',
              'x-eventos-delivery-id': 'delivery-1',
            },
          },
        },
        'request completed',
      );

      expect(output()).not.toContain('deadbeefcafe');
      // Correlation headers stay visible.
      expect(output()).toContain('delivery-1');
    });

    it('redacts a Firebase idToken in a request body', () => {
      const { logger, output } = capture();

      logger.info(
        { req: { body: { idToken: 'eyJhbGciOi.secret.token' } } },
        'x',
      );

      expect(output()).not.toContain('eyJhbGciOi.secret.token');
      expect(output()).toContain('[Redacted]');
    });

    it('masks phone numbers to the last four digits', () => {
      const { logger, output } = capture();

      logger.info(
        {
          req: {
            body: {
              phone: '+919876543210',
              primaryPhone: '+919123456789',
              customer: { phone: '+919000011111', name: 'Asha' },
            },
          },
        },
        'x',
      );

      const line = output();
      expect(line).not.toContain('9876543210');
      expect(line).not.toContain('9123456789');
      expect(line).not.toContain('9000011111');
      expect(line).toContain('3210');
      expect(line).toContain('6789');
      expect(line).toContain('1111');
      expect(line).toContain('Asha');
    });

    it('masks a phone to its last four digits only', () => {
      expect(maskPhoneForLog('+919876543210')).toBe('*********3210');
      expect(maskPhoneForLog('12')).toBe('12');
    });

    it('fully redacts non-phone secrets via the censor', () => {
      expect(logCensor('hunter2', ['req', 'body', 'password'])).toBe(
        '[Redacted]',
      );
      expect(logCensor({ number: '1' }, ['req', 'body', 'phone'])).toBe(
        '[Redacted]',
      );
    });
  });
});
