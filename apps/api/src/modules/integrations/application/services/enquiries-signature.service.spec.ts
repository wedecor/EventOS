import { createHmac } from 'node:crypto';
import {
  EnquiriesSignatureService,
  signEnquiriesFeedBody,
} from './enquiries-signature.service';

const PRIMARY = 'p'.repeat(40);
const NEXT = 'n'.repeat(40);
const NOW = new Date('2026-11-23T10:00:00.000Z');
const NOW_SECONDS = String(Math.floor(NOW.getTime() / 1000));
const BODY = JSON.stringify({ enquiryId: 'enq-1' });

function service(secrets: string[]): EnquiriesSignatureService {
  return new EnquiriesSignatureService({
    secrets,
    tenantId: 't',
  });
}

describe('EnquiriesSignatureService (M5-01)', () => {
  it('produces the documented v1 signature: HMAC-SHA256(secret, ts + "." + body)', () => {
    const expected = createHmac('sha256', PRIMARY)
      .update(`${NOW_SECONDS}.${BODY}`)
      .digest('hex');

    expect(signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY)).toBe(
      `v1=${expected}`,
    );
    // Buffer and string bodies sign identically.
    expect(signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, Buffer.from(BODY))).toBe(
      `v1=${expected}`,
    );
  });

  it('accepts a valid signature', () => {
    const result = service([PRIMARY]).verify({
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    });

    expect(result).toEqual({ ok: true });
  });

  it('rejects a signature made with the wrong secret', () => {
    const result = service([PRIMARY]).verify({
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody('x'.repeat(40), NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    });

    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a tampered body', () => {
    const result = service([PRIMARY]).verify({
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY.replace('enq-1', 'enq-2')),
      now: NOW,
    });

    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a signature bound to a different timestamp', () => {
    const result = service([PRIMARY]).verify({
      timestamp: String(Number(NOW_SECONDS) + 1),
      signature: signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    });

    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  describe('timestamp skew (300 s)', () => {
    const verifyAt = (offsetSeconds: number) => {
      const timestamp = String(Number(NOW_SECONDS) + offsetSeconds);
      return service([PRIMARY]).verify({
        timestamp,
        signature: signEnquiriesFeedBody(PRIMARY, timestamp, BODY),
        rawBody: Buffer.from(BODY),
        now: NOW,
      });
    };

    it('accepts exactly ±300 s', () => {
      expect(verifyAt(-300)).toEqual({ ok: true });
      expect(verifyAt(300)).toEqual({ ok: true });
    });

    it('rejects a delivery older than 300 s (replayed capture)', () => {
      expect(verifyAt(-301)).toEqual({ ok: false, reason: 'expired' });
    });

    it('rejects a delivery more than 300 s in the future', () => {
      expect(verifyAt(301)).toEqual({ ok: false, reason: 'expired' });
    });
  });

  describe('secret rotation (two active secrets)', () => {
    const signed = (secret: string) => ({
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody(secret, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    });

    it('accepts deliveries signed with either the current or the next secret', () => {
      const rotating = service([PRIMARY, NEXT]);

      expect(rotating.verify(signed(PRIMARY))).toEqual({ ok: true });
      expect(rotating.verify(signed(NEXT))).toEqual({ ok: true });
    });

    it('stops accepting the old secret once it is removed', () => {
      const afterRotation = service([NEXT]);

      expect(afterRotation.verify(signed(PRIMARY))).toEqual({
        ok: false,
        reason: 'bad_signature',
      });
      expect(afterRotation.verify(signed(NEXT))).toEqual({ ok: true });
    });
  });

  describe('malformed input', () => {
    const base = {
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    };

    it('rejects missing headers', () => {
      expect(
        service([PRIMARY]).verify({ ...base, signature: undefined }),
      ).toEqual({ ok: false, reason: 'missing_headers' });
      expect(
        service([PRIMARY]).verify({ ...base, timestamp: undefined }),
      ).toEqual({ ok: false, reason: 'missing_headers' });
    });

    it('rejects a missing raw body', () => {
      expect(
        service([PRIMARY]).verify({ ...base, rawBody: undefined }),
      ).toEqual({ ok: false, reason: 'missing_body' });
    });

    it('rejects a non-numeric timestamp', () => {
      expect(
        service([PRIMARY]).verify({
          ...base,
          timestamp: '2026-11-23T10:00:00Z',
        }),
      ).toEqual({ ok: false, reason: 'bad_timestamp' });
    });

    it.each([
      ['wrong scheme', (sig: string) => sig.replace('v1=', 'v2=')],
      ['no scheme', (sig: string) => sig.slice(3)],
      ['truncated', (sig: string) => sig.slice(0, -2)],
      ['non-hex', (sig: string) => `${sig.slice(0, -1)}z`],
      ['empty value', () => 'v1='],
    ])('rejects a %s signature without throwing', (_label, mutate) => {
      expect(
        service([PRIMARY]).verify({
          ...base,
          signature: mutate(base.signature),
        }),
      ).toEqual({ ok: false, reason: 'bad_signature' });
    });
  });

  it('rejects everything when no secret is configured', () => {
    const result = service([]).verify({
      timestamp: NOW_SECONDS,
      signature: signEnquiriesFeedBody(PRIMARY, NOW_SECONDS, BODY),
      rawBody: Buffer.from(BODY),
      now: NOW,
    });

    expect(result).toEqual({ ok: false, reason: 'not_configured' });
  });
});
