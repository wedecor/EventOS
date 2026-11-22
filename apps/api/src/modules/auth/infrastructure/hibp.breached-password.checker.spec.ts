import { createHash } from 'node:crypto';
import { HibpBreachedPasswordChecker } from './hibp.breached-password.checker';

// SHA-1 of "P@ssw0rd-that-is-long": computed at runtime so the test never hardcodes a
// digest. We split it exactly as the checker does to build a realistic range response.
function sha1Parts(password: string): { prefix: string; suffix: string } {
  const digest = createHash('sha1')
    .update(password)
    .digest('hex')
    .toUpperCase();
  return { prefix: digest.slice(0, 5), suffix: digest.slice(5) };
}

describe('HibpBreachedPasswordChecker (R1-10, k-Anonymity)', () => {
  const PASSWORD = 'P@ssw0rd-that-is-long';
  let checker: HibpBreachedPasswordChecker;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    checker = new HibpBreachedPasswordChecker();
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function mockRangeResponse(body: string, ok = true, status = 200) {
    fetchSpy.mockResolvedValue({
      ok,
      status,
      text: () => Promise.resolve(body),
    });
  }

  it('sends only the SHA-1 prefix (never the plaintext) with padding enabled', async () => {
    const { prefix } = sha1Parts(PASSWORD);
    mockRangeResponse('0000000000000000000000000000000000A:0');

    await checker.isBreached(PASSWORD);

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${prefix}`);
    expect(url).not.toContain(PASSWORD);
    expect((init.headers as Record<string, string>)['Add-Padding']).toBe(
      'true',
    );
  });

  it('returns true when the suffix appears with a positive count', async () => {
    const { suffix } = sha1Parts(PASSWORD);
    mockRangeResponse(`SOMEOTHERSUFFIX:3\r\n${suffix}:42\r\nANOTHER:1`);

    await expect(checker.isBreached(PASSWORD)).resolves.toBe(true);
  });

  it('returns false when the suffix is absent from the range', async () => {
    mockRangeResponse('SOMEOTHERSUFFIX:3\r\nANOTHER:1');

    await expect(checker.isBreached(PASSWORD)).resolves.toBe(false);
  });

  it('treats a padded (count 0) suffix match as not breached', async () => {
    const { suffix } = sha1Parts(PASSWORD);
    mockRangeResponse(`${suffix}:0`);

    await expect(checker.isBreached(PASSWORD)).resolves.toBe(false);
  });

  it('fails open (returns false) on a non-200 response', async () => {
    mockRangeResponse('', false, 503);

    await expect(checker.isBreached(PASSWORD)).resolves.toBe(false);
  });

  it('fails open (returns false) when the request throws', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));

    await expect(checker.isBreached(PASSWORD)).resolves.toBe(false);
  });
});
