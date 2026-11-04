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
  })
  .superRefine((config, ctx) => {
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
