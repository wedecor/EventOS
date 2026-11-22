import { maskPhone, normalizePhoneE164 } from './phone-normalization';

describe('normalizePhoneE164', () => {
  it('accepts well-formed E.164 numbers', () => {
    expect(normalizePhoneE164('+919876543210')).toBe('+919876543210');
  });

  it('strips separators and converts a 00 prefix', () => {
    expect(normalizePhoneE164('+91 98765-43210')).toBe('+919876543210');
    expect(normalizePhoneE164('0091 (987) 654 3210')).toBe('+919876543210');
  });

  it('does not guess a country code', () => {
    expect(normalizePhoneE164('9876543210')).toBeNull();
  });

  it('rejects empty, malformed, and non-string input', () => {
    expect(normalizePhoneE164('')).toBeNull();
    expect(normalizePhoneE164('+0123456789')).toBeNull();
    expect(normalizePhoneE164('+12')).toBeNull();
    expect(normalizePhoneE164('abc')).toBeNull();
    expect(normalizePhoneE164(null)).toBeNull();
    expect(normalizePhoneE164(undefined)).toBeNull();
  });
});

describe('maskPhone', () => {
  it('masks all but the last four characters', () => {
    expect(maskPhone('+919876543210')).toBe('*********3210');
  });

  it('handles short and empty values', () => {
    expect(maskPhone('123')).toBe('123');
    expect(maskPhone('')).toBeNull();
    expect(maskPhone(null)).toBeNull();
  });
});
