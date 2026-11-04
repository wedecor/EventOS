import { Writable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import {
  LOG_REDACT_CONFIG,
  LOG_SERVICE_NAME,
  buildPinoHttpOptions,
  generateRequestId,
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
});
