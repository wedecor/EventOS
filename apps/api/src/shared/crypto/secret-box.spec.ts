import { decryptSecret, encryptSecret, maskSecret } from './secret-box';

describe('secret-box', () => {
  const key = 'test-jwt-secret-at-least-32-characters-long';

  it('round-trips secrets', () => {
    const ciphertext = encryptSecret('super-secret', key);
    expect(ciphertext.startsWith('v1.')).toBe(true);
    expect(ciphertext).not.toContain('super-secret');
    expect(decryptSecret(ciphertext, key)).toBe('super-secret');
  });

  it('masks configured secrets', () => {
    expect(maskSecret(true)).toBe('••••••••');
    expect(maskSecret(false)).toBeNull();
  });
});
