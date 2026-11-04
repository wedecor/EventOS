import * as bcrypt from 'bcrypt';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes a password to a bcrypt string that is not the plaintext', async () => {
    const hash = await service.hash('Sup3r$ecret');

    expect(hash).not.toBe('Sup3r$ecret');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('uses bcrypt cost factor 12 (docs/14 password policy)', async () => {
    const hash = await service.hash('Sup3r$ecret');

    // bcrypt hash format: $2b$<cost>$<salt+digest>
    expect(hash.split('$')[2]).toBe('12');
  });

  it('produces a different hash each time (random salt)', async () => {
    const first = await service.hash('Sup3r$ecret');
    const second = await service.hash('Sup3r$ecret');

    expect(first).not.toBe(second);
  });

  it('verifies a correct password against its hash', async () => {
    const hash = await service.hash('Sup3r$ecret');

    await expect(service.compare('Sup3r$ecret', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await service.hash('Sup3r$ecret');

    await expect(service.compare('wrong-password', hash)).resolves.toBe(false);
  });

  it('is compatible with hashes produced directly by bcrypt', async () => {
    const hash = await bcrypt.hash('external', 12);

    await expect(service.compare('external', hash)).resolves.toBe(true);
  });
});
