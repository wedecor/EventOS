import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Options as PinoHttpOptions } from 'pino-http';

/**
 * R1-03 (docs/14 §Sensitive Data Classification: "Restricted... never in
 * logs") — request/response fields stripped from every log line by
 * pino-http. Bearer access tokens and refresh-token cookies are
 * credentials, not request metadata, and must never appear in application
 * logs.
 */
export const LOG_REDACT_CONFIG: { paths: string[]; censor: string } = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'req.body.password',
    'req.body.currentPassword',
    'req.body.newPassword',
    'req.body.refreshToken',
  ],
  censor: '[Redacted]',
};

export const LOG_SERVICE_NAME = 'event-os-api';

/**
 * R2-07 (docs/16 §Logging: "Request ID in every log entry for correlation";
 * docs/10-implementation-specification §Logging Strategy) — stable
 * correlation id for JSON log shipping. Prefer inbound `x-request-id`,
 * otherwise generate a UUID (not the default pino-http integer counter,
 * which collides across replicas).
 */
export function generateRequestId(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const header = req.headers['x-request-id'];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  const requestId =
    (typeof fromHeader === 'string' && fromHeader.trim().length > 0
      ? fromHeader.trim()
      : undefined) ?? randomUUID();

  res.setHeader('x-request-id', requestId);
  return requestId;
}

/**
 * Builds the `pinoHttp` options used by `LoggerModule.forRoot`.
 * Staging/production emit newline-delimited JSON on stdout (no pino-pretty)
 * so an external shipper can scrape container logs without app-side agents.
 */
export function buildPinoHttpOptions(
  env: {
    NODE_ENV?: string;
    LOG_LEVEL?: string;
  } = process.env,
): PinoHttpOptions {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const usePrettyTransport = nodeEnv !== 'production' && nodeEnv !== 'staging';

  return {
    level: env.LOG_LEVEL ?? 'info',
    redact: LOG_REDACT_CONFIG,
    genReqId: generateRequestId,
    // Surface `requestId` at the top level of every request-scoped log line
    // so aggregators can filter without inspecting nested `req.id`.
    customProps: (req) => ({
      service: LOG_SERVICE_NAME,
      requestId: req.id,
    }),
    transport: usePrettyTransport
      ? { target: 'pino-pretty', options: { singleLine: true } }
      : undefined,
    autoLogging: {
      ignore: (req) => req.url?.startsWith('/health') ?? false,
    },
  };
}
