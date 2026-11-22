import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { BreachedPasswordChecker } from '../application/ports/breached-password.checker';

// Have I Been Pwned "Pwned Passwords" range API (docs/14 §Password Requirements:
// breach detection via the HIBP API using k-Anonymity). Only the first 5 characters
// of the SHA-1 hash are transmitted; the plaintext password never leaves the process.
const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const REQUEST_TIMEOUT_MS = 3000;

/**
 * R1-10 — infrastructure adapter for {@link BreachedPasswordChecker}. Performs the
 * k-Anonymity lookup and fails open: any network/HTTP error is logged and treated as
 * "not breached" so a third-party outage never blocks a legitimate password change.
 */
@Injectable()
export class HibpBreachedPasswordChecker extends BreachedPasswordChecker {
  private readonly logger = new Logger(HibpBreachedPasswordChecker.name);

  async isBreached(plainTextPassword: string): Promise<boolean> {
    const sha1 = createHash('sha1')
      .update(plainTextPassword)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let body: string;
      try {
        const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
          // "Add-Padding" masks the size of the response so the queried prefix's
          // real match count cannot be inferred from response length.
          headers: { 'Add-Padding': 'true' },
          signal: controller.signal,
        });
        if (!response.ok) {
          this.logger.warn(
            `HIBP lookup returned ${response.status}; treating password as not breached (fail-open).`,
          );
          return false;
        }
        body = await response.text();
      } finally {
        clearTimeout(timeout);
      }

      return this.suffixIsBreached(body, suffix);
    } catch (error: unknown) {
      this.logger.warn(
        `HIBP lookup failed; treating password as not breached (fail-open): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      return false;
    }
  }

  // Each line is "<SUFFIX>:<count>". Padded (fake) entries carry a count of 0, so a
  // match requires the exact suffix with a positive count.
  private suffixIsBreached(body: string, suffix: string): boolean {
    for (const line of body.split('\n')) {
      const [lineSuffix, countText] = line.trim().split(':');
      if (lineSuffix?.toUpperCase() !== suffix) {
        continue;
      }
      const count = Number.parseInt(countText ?? '0', 10);
      return Number.isFinite(count) && count > 0;
    }
    return false;
  }
}
