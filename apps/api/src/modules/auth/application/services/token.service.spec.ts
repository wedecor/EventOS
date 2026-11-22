import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  TokenService,
  type AccessTokenPayload,
} from './token.service';

describe('TokenService', () => {
  const secret = 'unit-test-jwt-secret-at-least-32-characters';
  let jwtService: JwtService;
  let service: TokenService;

  const claims = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    email: 'admin@wedecor.events',
    role: 'admin',
  };

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    service = new TokenService(jwtService);
  });

  it('signs an access token that verifies and carries the identity claims', () => {
    const token = service.signAccessToken(claims);

    const decoded = jwtService.verify<AccessTokenPayload>(token, { secret });

    expect(decoded.sub).toBe('user-1');
    expect(decoded.tenantId).toBe('tenant-1');
    expect(decoded.email).toBe('admin@wedecor.events');
    expect(decoded.role).toBe('admin');
    expect(decoded.type).toBe('access');
  });

  it('sets the documented 15-minute access-token expiry', () => {
    const token = service.signAccessToken(claims);

    const decoded = jwtService.verify<
      AccessTokenPayload & { exp: number; iat: number }
    >(token, { secret });

    expect(decoded.exp - decoded.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);
  });

  it('fails verification when signed with a different secret', () => {
    const token = service.signAccessToken(claims);

    expect(() => {
      jwtService.verify(token, { secret: 'a-different-secret' });
    }).toThrow();
  });

  it('generates a refresh token with a sha256 hash and 7-day expiry', () => {
    const before = Date.now();
    const generated = service.generateRefreshToken();

    expect(generated.rawToken).toHaveLength(64); // 32 random bytes hex-encoded
    expect(generated.tokenHash).toBe(
      service.hashRefreshToken(generated.rawToken),
    );
    expect(generated.tokenHash).not.toBe(generated.rawToken);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(generated.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + sevenDaysMs - 1000,
    );
  });

  it('matches a raw refresh token against its stored hash in constant time', () => {
    const generated = service.generateRefreshToken();

    expect(
      service.matchesRefreshToken(generated.rawToken, generated.tokenHash),
    ).toBe(true);
    expect(service.matchesRefreshToken('tampered', generated.tokenHash)).toBe(
      false,
    );
  });

  it('composes and parses the <sessionId>.<rawToken> refresh token', () => {
    const composed = service.composeRefreshToken(
      'session-1',
      'raw-token-value',
    );

    expect(composed).toBe('session-1.raw-token-value');
    expect(service.parseRefreshToken(composed)).toEqual({
      sessionId: 'session-1',
      rawToken: 'raw-token-value',
    });
  });

  it('returns null when parsing a malformed refresh token', () => {
    expect(service.parseRefreshToken('no-separator')).toBeNull();
    expect(service.parseRefreshToken('.leading')).toBeNull();
    expect(service.parseRefreshToken('trailing.')).toBeNull();
    expect(service.parseRefreshToken('')).toBeNull();
  });
});
