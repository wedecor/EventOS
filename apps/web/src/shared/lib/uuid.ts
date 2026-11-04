import { z } from 'zod';

const uuidSchema = z.string().uuid();

/** Trim and validate a UUID for hub open-by-id forms. */
export function parseUuidInput(value: string): string | null {
  const parsed = uuidSchema.safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}
