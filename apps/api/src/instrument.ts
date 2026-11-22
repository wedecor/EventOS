import { config as loadDotenv } from 'dotenv';
import * as Sentry from '@sentry/nestjs';

// Mirror `ConfigModule.forRoot({ envFilePath: ['.env.local', '.env'] })` so
// SENTRY_DSN from local env files is visible before Nest bootstraps. Default
// dotenv behavior does not override variables already present in process.env
// (shell / container inject still wins).
loadDotenv({ path: '.env.local' });
loadDotenv({ path: '.env' });

/**
 * R2-06 (docs/16 §Environment Variables: `SENTRY_DSN`) — process-level Sentry
 * bootstrap. Must be imported before any other application modules so default
 * handlers for uncaught exceptions and unhandled rejections are registered
 * early (NestJS / @sentry/nestjs guidance).
 *
 * Tracing, profiling, session replay, and performance monitoring are intentionally
 * not enabled (out of scope for R2-06).
 */
export function resolveSentryDsn(
  rawDsn: string | undefined = process.env.SENTRY_DSN,
): string | undefined {
  const trimmed = rawDsn?.trim();
  if (!trimmed) {
    return undefined;
  }
  // Reject obvious placeholders from staging templates.
  if (trimmed.includes('REPLACE')) {
    return undefined;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function initSentryFromEnv(): boolean {
  const dsn = resolveSentryDsn();
  const enabled = dsn !== undefined;

  Sentry.init({
    dsn,
    enabled,
    environment: process.env.NODE_ENV ?? 'development',
    // Default integrations capture uncaughtException + unhandledRejection.
    // Do not set tracesSampleRate — tracing is out of scope.
    sendDefaultPii: false,
  });

  return enabled;
}

initSentryFromEnv();
