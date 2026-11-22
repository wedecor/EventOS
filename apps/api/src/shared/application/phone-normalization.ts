const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/**
 * M5-01 — Normalises a phone number to strict E.164 (`+<country><number>`), or
 * returns `null` when the input cannot be reliably normalised.
 *
 * Deliberately conservative and country-agnostic: it strips visual separators
 * and converts a leading `00` to `+`, but never guesses a country code. Callers
 * (e.g. the Enquiries feed) are expected to send E.164 already.
 */
export function normalizePhoneE164(
  raw: string | null | undefined,
): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  let candidate = raw.trim().replace(/[\s().-]/g, '');
  if (candidate.startsWith('00')) {
    candidate = `+${candidate.slice(2)}`;
  }

  return E164_PATTERN.test(candidate) ? candidate : null;
}

/** Masks all but the last four digits (e.g. for logs / audit metadata). */
export function maskPhone(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  const visible = raw.slice(-4);
  return `${'*'.repeat(Math.max(raw.length - 4, 0))}${visible}`;
}
