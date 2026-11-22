import { z } from 'zod';

// R1-06 (docs/16 §Environment Variables: "NODE_ENV | All | development,
// staging, production") — `staging` is a documented deployment tier distinct
// from `production`; `test` is the Jest/CI runner tier and is not a deployed
// environment.
const NODE_ENVS = ['development', 'test', 'staging', 'production'] as const;

/** Deployed, browser-facing tiers where CORS must be explicitly locked down. */
const STRICT_CORS_NODE_ENVS: ReadonlySet<string> = new Set([
  'staging',
  'production',
]);

export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVS).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGIN: z.string().default('*'),
    DATABASE_URL: z.string().min(1),
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    // R1-04 (docs/16 §Environment Variables: "JWT_SECRET | All | JWT signing
    // key (min 256 bits)"; docs/22 §Troubleshooting: "must be >= 32 characters
    // if set") — mandatory in every environment, never optional. Missing,
    // empty, and too-short values are all rejected by this single check.
    JWT_SECRET: z
      .string()
      .min(
        32,
        'JWT_SECRET must be at least 32 characters (256 bits) — see docs/16-deployment-strategy.md.',
      ),
    // R2-06 (docs/16 §Environment Variables: "SENTRY_DSN | Staging, Prod") —
    // optional. Empty/absent keeps local development unchanged; a present value
    // is normalized to undefined when blank so callers can treat "unset" uniformly.
    SENTRY_DSN: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed && trimmed.length > 0 ? trimmed : undefined;
      }),
    // M3 — storage / mail (optional; defaults keep local/test adapters).
    STORAGE_PROVIDER: z.enum(['local', 's3', 'none']).default('local'),
    STORAGE_LOCAL_ROOT: z.string().optional(),
    STORAGE_ENDPOINT: z.string().optional(),
    STORAGE_ACCESS_KEY: z.string().optional(),
    STORAGE_SECRET_KEY: z.string().optional(),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_MAX_UPLOAD_BYTES: z.coerce.number().int().positive().optional(),
    MAIL_PROVIDER: z.enum(['test', 'smtp', 'none']).default('test'),
    MAIL_FROM_NAME: z.string().optional(),
    MAIL_FROM_EMAIL: z.string().email().optional().or(z.literal('')),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value == null ? undefined : value === 'true')),
    MAIL_WEBHOOK_SECRET: z.string().optional(),
    MAIL_IDEMPOTENCY_WINDOW_SEC: z.coerce.number().int().positive().optional(),
    // M4-AI — LLM provider (default test adapter; no live calls without key).
    AI_PROVIDER: z.enum(['test', 'openai', 'none']).default('test'),
    AI_MODEL: z.string().default('gpt-4o-mini'),
    AI_API_KEY: z
      .string()
      .optional()
      .transform((value) => {
        const trimmed = value?.trim();
        return trimmed && trimmed.length > 0 ? trimmed : undefined;
      }),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
    /** USD per 1M input tokens — optional cost estimate only. */
    AI_INPUT_PRICE_PER_1M: z.coerce.number().nonnegative().optional(),
    /** USD per 1M output tokens — optional cost estimate only. */
    AI_OUTPUT_PRICE_PER_1M: z.coerce.number().nonnegative().optional(),
    /** Max AI feature calls per user per window (0 = disabled). */
    AI_RATE_LIMIT_PER_USER_PER_HOUR: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(30),
    /** Max AI feature calls per tenant per window (0 = disabled). */
    AI_RATE_LIMIT_PER_TENANT_PER_HOUR: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(200),
    /** Sliding fixed window length for AI rate limits (seconds). */
    AI_RATE_LIMIT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(3600),
  })
  .superRefine((config, ctx) => {
    if (config.AI_PROVIDER === 'openai' && !config.AI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['AI_API_KEY'],
        message:
          'AI_PROVIDER=openai requires AI_API_KEY (server-side only; never expose to clients).',
      });
    }
    // R1-06 (docs/14 §CORS: "No wildcard origins in production"; docs/16
    // §Environment Variables: "CORS_ORIGIN | All | Allowed CORS origin(s)") —
    // `development` keeps the permissive `*` default so local dev keeps
    // working unchanged. Outside development (staging, production),
    // CORS_ORIGIN must be an explicit, non-wildcard origin or bootstrap fails.
    if (!STRICT_CORS_NODE_ENVS.has(config.NODE_ENV)) {
      return;
    }

    const trimmedOrigin = config.CORS_ORIGIN.trim();
    if (trimmedOrigin.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGIN'],
        message: `CORS_ORIGIN is required outside development (NODE_ENV=${config.NODE_ENV}) — see docs/16-deployment-strategy.md §Environment Variables.`,
      });
      return;
    }

    const includesWildcard = trimmedOrigin
      .split(',')
      .some((origin) => origin.trim() === '*');
    if (includesWildcard) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGIN'],
        message: `CORS_ORIGIN must not be "*" outside development (NODE_ENV=${config.NODE_ENV}) — see docs/14-security-principles.md §CORS: "No wildcard origins in production".`,
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${message}`);
  }

  return parsed.data;
}
