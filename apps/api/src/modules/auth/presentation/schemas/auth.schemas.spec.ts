import { firebaseExchangeSchema } from './auth.schemas';

describe('firebaseExchangeSchema (M5-01)', () => {
  it('accepts an idToken with an optional client', () => {
    expect(firebaseExchangeSchema.safeParse({ idToken: 'abc' }).success).toBe(
      true,
    );
    expect(
      firebaseExchangeSchema.safeParse({ idToken: 'abc', client: 'mobile' })
        .success,
    ).toBe(true);
  });

  it('rejects unknown keys (strict)', () => {
    expect(
      firebaseExchangeSchema.safeParse({ idToken: 'abc', tenantId: 'x' })
        .success,
    ).toBe(false);
  });

  it('rejects empty, oversized and invalid-client payloads', () => {
    expect(firebaseExchangeSchema.safeParse({ idToken: '' }).success).toBe(
      false,
    );
    expect(
      firebaseExchangeSchema.safeParse({ idToken: 'a'.repeat(4097) }).success,
    ).toBe(false);
    expect(
      firebaseExchangeSchema.safeParse({ idToken: 'abc', client: 'desktop' })
        .success,
    ).toBe(false);
    expect(firebaseExchangeSchema.safeParse({}).success).toBe(false);
  });
});
