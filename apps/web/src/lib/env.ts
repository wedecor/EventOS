import { z } from 'zod';

/**
 * Public client environment. Validated at module load so misconfiguration fails fast
 * during development builds (values are inlined at build time for static export).
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Event OS'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment configuration: ${parsed.error.message}`,
  );
}

export const env = parsed.data;
