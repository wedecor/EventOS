import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto';

const PREFIX = 'v1';

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'eventos-integration-settings', 32);
}

/** Encrypt a secret for IntegrationSettings persistence. Never log plaintext. */
export function encryptSecret(plaintext: string, secretKey: string): string {
  const key = deriveKey(secretKey);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptSecret(ciphertext: string, secretKey: string): string {
  const [prefix, ivB64, tagB64, dataB64] = ciphertext.split('.');
  if (prefix !== PREFIX || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid ciphertext');
  }
  const key = deriveKey(secretKey);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivB64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function maskSecret(configured: boolean): string | null {
  return configured ? '••••••••' : null;
}
