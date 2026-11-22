import { linkExternalIdentitySchema } from './external-identity.schemas';

describe('linkExternalIdentitySchema (M5-01)', () => {
  const valid = {
    userId: '5b8f6b44-3c58-4e3d-8c1a-0a6e4f1a2b3c',
    provider: 'firebase',
    subject: 'uid-1',
  };

  it('accepts a minimal and a full payload', () => {
    expect(linkExternalIdentitySchema.safeParse(valid).success).toBe(true);
    expect(
      linkExternalIdentitySchema.safeParse({
        ...valid,
        email: 'a@example.test',
      }).success,
    ).toBe(true);
  });

  it('rejects other providers, bad uuids, unknown keys and empty subjects', () => {
    expect(
      linkExternalIdentitySchema.safeParse({ ...valid, provider: 'google' })
        .success,
    ).toBe(false);
    expect(
      linkExternalIdentitySchema.safeParse({ ...valid, userId: 'nope' })
        .success,
    ).toBe(false);
    expect(
      linkExternalIdentitySchema.safeParse({ ...valid, tenantId: 'x' }).success,
    ).toBe(false);
    expect(
      linkExternalIdentitySchema.safeParse({ ...valid, subject: '' }).success,
    ).toBe(false);
  });
});
