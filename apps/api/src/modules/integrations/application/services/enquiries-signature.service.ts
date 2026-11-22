import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnquiriesFeedConfig } from '../ports/enquiries-feed.config';

/** Maximum accepted clock skew between sender and EventOS (seconds). */
export const SIGNATURE_MAX_SKEW_SECONDS = 300;

const SIGNATURE_PATTERN = /^v1=([0-9a-f]{64})$/i;
const TIMESTAMP_PATTERN = /^\d{1,12}$/;

export type SignatureFailureReason =
  | 'not_configured'
  | 'missing_headers'
  | 'missing_body'
  | 'bad_timestamp'
  | 'expired'
  | 'bad_signature';

export type SignatureVerification =
  { ok: true } | { ok: false; reason: SignatureFailureReason };

/** `v1=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>` */
export function signEnquiriesFeedBody(
  secret: string,
  timestamp: string,
  rawBody: Buffer | string,
): string {
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.`)
    .update(rawBody)
    .digest('hex');
  return `v1=${digest}`;
}

/**
 * Verifies the HMAC signature of an Enquiries feed delivery against the raw
 * request body. Two secrets may be active (rotation); the comparison is
 * constant-time and evaluates every secret so timing does not reveal which
 * (if any) matched.
 */
@Injectable()
export class EnquiriesSignatureService {
  constructor(private readonly config: EnquiriesFeedConfig) {}

  verify(input: {
    timestamp: string | undefined;
    signature: string | undefined;
    rawBody: Buffer | string | undefined;
    now?: Date;
  }): SignatureVerification {
    if (this.config.secrets.length === 0) {
      return { ok: false, reason: 'not_configured' };
    }
    if (!input.timestamp || !input.signature) {
      return { ok: false, reason: 'missing_headers' };
    }
    if (input.rawBody === undefined) {
      return { ok: false, reason: 'missing_body' };
    }
    if (!TIMESTAMP_PATTERN.test(input.timestamp)) {
      return { ok: false, reason: 'bad_timestamp' };
    }

    const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
    if (
      Math.abs(nowSeconds - Number(input.timestamp)) >
      SIGNATURE_MAX_SKEW_SECONDS
    ) {
      return { ok: false, reason: 'expired' };
    }

    const match = SIGNATURE_PATTERN.exec(input.signature.trim());
    if (!match) {
      return { ok: false, reason: 'bad_signature' };
    }
    const provided = Buffer.from(match[1], 'hex');

    let matched = false;
    for (const secret of this.config.secrets) {
      const expected = Buffer.from(
        signEnquiriesFeedBody(secret, input.timestamp, input.rawBody).slice(3),
        'hex',
      );
      // Both are 32 bytes (pattern-enforced), so timingSafeEqual never throws.
      if (timingSafeEqual(provided, expected)) {
        matched = true;
      }
    }

    return matched ? { ok: true } : { ok: false, reason: 'bad_signature' };
  }
}
