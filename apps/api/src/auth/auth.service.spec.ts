jest.mock('@nestjs/jwt', () => ({
  JwtService: class MockJwtService {
    signAsync = jest.fn().mockResolvedValue('signed-token');
    verify = jest.fn();
  },
}));

import * as bcrypt from 'bcrypt';
import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { TenantRepository } from '../modules/platform/domain/repositories/tenant.repository';
import type { AuthSessionRepository } from '../modules/platform/domain/repositories/auth-session.repository';
import type { UserRepository } from '../modules/platform/domain/repositories/user.repository';

describe('AuthService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  let userRepository: jest.Mocked<UserRepository>;
  let tenantRepository: jest.Mocked<TenantRepository>;
  let authSessionRepository: jest.Mocked<AuthSessionRepository>;
  let jwtService: JwtService;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let service: AuthService;

  beforeEach(() => {
    userRepository = {
      findByTenantAndEmail: jest.fn(),
      findById: jest.fn(),
    };
    tenantRepository = {
      findBySlug: jest.fn(),
    };
    authSessionRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'session-1',
        tenantId,
        userId,
        tokenHash: 'hash',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      }),
      findActiveByTokenHash: jest.fn(),
      revoke: jest.fn(),
    };
    jwtService = new JwtService({
      secret: 'test-secret-min-32-characters-long',
    });
    configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    service = new AuthService(
      userRepository,
      tenantRepository,
      authSessionRepository,
      jwtService,
      configService as unknown as ConfigService,
    );
  });

  it('returns tokens when credentials are valid', async () => {
    const passwordHash = await bcrypt.hash('secret-pass', 4);
    tenantRepository.findBySlug.mockResolvedValue({
      id: tenantId,
      name: 'We Decor',
      slug: 'we-decor',
    });
    userRepository.findByTenantAndEmail.mockResolvedValue({
      id: userId,
      tenantId,
      email: 'admin@wedecor.events',
      name: 'Admin',
      role: 'admin',
      passwordHash,
      version: 1,
    });

    const result = await service.login({
      email: 'admin@wedecor.events',
      password: 'secret-pass',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.accessToken).toBe('signed-token');
      expect(result.value.refreshToken).toBeTruthy();
    }
    expect(authSessionRepository.create.mock.calls.length).toBe(1);
  });

  it('rejects invalid password', async () => {
    const passwordHash = await bcrypt.hash('secret-pass', 4);
    tenantRepository.findBySlug.mockResolvedValue({
      id: tenantId,
      name: 'We Decor',
      slug: 'we-decor',
    });
    userRepository.findByTenantAndEmail.mockResolvedValue({
      id: userId,
      tenantId,
      email: 'admin@wedecor.events',
      name: 'Admin',
      role: 'admin',
      passwordHash,
      version: 1,
    });

    const result = await service.login({
      email: 'admin@wedecor.events',
      password: 'wrong',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });
});
