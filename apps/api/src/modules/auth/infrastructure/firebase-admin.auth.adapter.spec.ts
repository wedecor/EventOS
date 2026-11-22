import { FirebaseAdminAuthAdapter } from './firebase-admin.auth.adapter';

const verifyIdToken = jest.fn();

jest.mock('firebase-admin/app', () => ({
  getApps: () => [],
  initializeApp: jest.fn().mockReturnValue({ name: 'eventos-firebase-bridge' }),
}));
jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken }),
}));

describe('FirebaseAdminAuthAdapter', () => {
  const adapter = new FirebaseAdminAuthAdapter('project-x');

  beforeEach(() => verifyIdToken.mockReset());

  it('verifies with checkRevoked=true and maps claims', async () => {
    verifyIdToken.mockResolvedValue({
      uid: 'u1',
      email: 'a@b.c',
      aud: 'project-x',
      iss: 'https://securetoken.google.com/project-x',
      iat: 1_700_000_000,
      auth_time: 1_699_999_000,
    });

    const result = await adapter.verifyIdToken('tok');

    expect(verifyIdToken).toHaveBeenCalledWith('tok', true);
    expect(result).toEqual({
      ok: true,
      claims: {
        uid: 'u1',
        email: 'a@b.c',
        audience: 'project-x',
        issuer: 'https://securetoken.google.com/project-x',
        issuedAt: 1_700_000_000,
        authTime: 1_699_999_000,
      },
    });
  });

  it.each([
    ['auth/id-token-expired', 'expired'],
    ['auth/id-token-revoked', 'revoked'],
    ['auth/user-disabled', 'disabled'],
    ['auth/argument-error', 'invalid'],
    ['auth/internal-error', 'unavailable'],
  ])('maps %s to %s', async (code, reason) => {
    verifyIdToken.mockRejectedValue({ code });

    await expect(adapter.verifyIdToken('tok')).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it('treats unknown failures as invalid and exposes the project id', async () => {
    verifyIdToken.mockRejectedValue(new Error('boom'));

    await expect(adapter.verifyIdToken('tok')).resolves.toEqual({
      ok: false,
      reason: 'invalid',
    });
    expect(adapter.getProjectId()).toBe('project-x');
  });
});
