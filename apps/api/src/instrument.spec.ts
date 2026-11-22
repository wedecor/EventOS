import * as Sentry from '@sentry/nestjs';
import { initSentryFromEnv, resolveSentryDsn } from './instrument';

jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

describe('instrument — Sentry bootstrap (R2-06)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('resolveSentryDsn', () => {
    it('returns undefined when SENTRY_DSN is absent', () => {
      expect(resolveSentryDsn(undefined)).toBeUndefined();
    });

    it('returns undefined when SENTRY_DSN is blank or whitespace', () => {
      expect(resolveSentryDsn('')).toBeUndefined();
      expect(resolveSentryDsn('   ')).toBeUndefined();
    });

    it('returns undefined for staging-template placeholders containing REPLACE', () => {
      expect(
        resolveSentryDsn('https://REPLACE_PUBLIC@REPLACE_HOST/REPLACE_PROJECT'),
      ).toBeUndefined();
    });

    it('returns undefined for non-HTTP DSNs', () => {
      expect(resolveSentryDsn('not-a-url')).toBeUndefined();
    });

    it('accepts a well-formed HTTPS DSN', () => {
      const dsn = 'https://examplePublicKey@o0.ingest.sentry.io/0';
      expect(resolveSentryDsn(dsn)).toBe(dsn);
    });
  });

  describe('initSentryFromEnv', () => {
    it('initializes Sentry disabled when SENTRY_DSN is unset (local default)', () => {
      delete process.env.SENTRY_DSN;

      const enabled = initSentryFromEnv();

      expect(enabled).toBe(false);
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: undefined,
          enabled: false,
        }),
      );
    });

    it('initializes Sentry enabled when a valid placeholder DSN is set', () => {
      process.env.SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0';
      process.env.NODE_ENV = 'staging';

      const enabled = initSentryFromEnv();

      expect(enabled).toBe(true);
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
          enabled: true,
          environment: 'staging',
        }),
      );
      // R2-06 out of scope — must not enable tracing/performance.
      const initArg = (Sentry.init as jest.Mock).mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(initArg).not.toHaveProperty('tracesSampleRate');
      expect(initArg).not.toHaveProperty('profilesSampleRate');
    });
  });
});
