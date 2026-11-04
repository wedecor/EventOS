import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { BreachedPasswordChecker } from '../src/modules/auth/application/ports/breached-password.checker';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { PasswordHistoryRepository } from '../src/modules/auth/domain/repositories/password-history.repository';
import { SessionRepository } from '../src/modules/auth/domain/repositories/session.repository';
import { UserRepository } from '../src/modules/auth/domain/repositories/user.repository';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const USER_ID = '11111111-1111-1111-1111-111111111111';
const CURRENT_PASSWORD = 'CurrentPass1!';
const NEW_PASSWORD = 'BrandNewPass1!';

/**
 * R1-10 — verifies the self-service password-change flow end-to-end through the HTTP
 * layer (docs/14 §Password Requirements):
 * - a valid change succeeds, persists the new hash, and retires the old one to history;
 * - reused, breached, and policy-violating passwords are rejected;
 * - an incorrect current password is rejected.
 *
 * The user/history repositories and the HIBP breach checker are stubbed so no real
 * database or network is required; password hashing/verification uses real bcrypt.
 */
describe('Password change (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;
  let currentHash: string;

  const findById = jest.fn();
  const updatePassword = jest.fn().mockResolvedValue(undefined);
  const findRecentHashes = jest.fn().mockResolvedValue([]);
  const addHistory = jest.fn().mockResolvedValue(undefined);
  const revokeAllForUser = jest.fn().mockResolvedValue(undefined);
  const isBreached = jest.fn().mockResolvedValue(false);

  const bearer = (): string =>
    `Bearer ${tokenService.signAccessToken({
      userId: USER_ID,
      tenantId: TENANT_ID,
      email: 'owner@wedecor.test',
      role: 'owner',
    })}`;

  beforeAll(async () => {
    currentHash = await bcrypt.hash(CURRENT_PASSWORD, 12);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        status: 'ready',
        quit: jest.fn().mockResolvedValue('OK'),
        connect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(UserRepository)
      .useValue({ findById, updatePassword })
      .overrideProvider(PasswordHistoryRepository)
      .useValue({ findRecentHashes, add: addHistory })
      .overrideProvider(SessionRepository)
      .useValue({ revokeAllForUser })
      .overrideProvider(BreachedPasswordChecker)
      .useValue({ isBreached })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    findById.mockResolvedValue({
      id: USER_ID,
      tenantId: TENANT_ID,
      email: 'owner@wedecor.test',
      name: 'Owner',
      role: 'owner',
      passwordHash: currentHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    findRecentHashes.mockResolvedValue([]);
    isBreached.mockResolvedValue(false);
  });

  afterEach(() => {
    updatePassword.mockClear();
    addHistory.mockClear();
    revokeAllForUser.mockClear();
    findById.mockReset();
    findRecentHashes.mockReset();
    isBreached.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(401);
  });

  it('changes the password on the happy path and retires the old hash', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', bearer())
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(200);

    expect(updatePassword).toHaveBeenCalledTimes(1);
    const [tenantId, userId, newHash] = updatePassword.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(tenantId).toBe(TENANT_ID);
    expect(userId).toBe(USER_ID);
    await expect(bcrypt.compare(NEW_PASSWORD, newHash)).resolves.toBe(true);
    expect(addHistory).toHaveBeenCalledWith(TENANT_ID, USER_ID, currentHash);
    expect(revokeAllForUser).toHaveBeenCalledWith(TENANT_ID, USER_ID);
  });

  it('rejects an incorrect current password (401)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', bearer())
      .send({ currentPassword: 'WrongCurrent1!', newPassword: NEW_PASSWORD })
      .expect(401);

    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('rejects a new password that fails the complexity policy (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', bearer())
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: 'weak' })
      .expect(400);

    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('rejects reuse of the current password (400)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', bearer())
      .send({
        currentPassword: CURRENT_PASSWORD,
        newPassword: CURRENT_PASSWORD,
      })
      .expect(400);

    const body = response.body as { details?: { reason?: string } };
    expect(body.details?.reason).toBe('PASSWORD_REUSED');
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('rejects a breached password (400)', async () => {
    isBreached.mockResolvedValue(true);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/change-password')
      .set('Authorization', bearer())
      .send({ currentPassword: CURRENT_PASSWORD, newPassword: NEW_PASSWORD })
      .expect(400);

    const body = response.body as { details?: { reason?: string } };
    expect(body.details?.reason).toBe('PASSWORD_BREACHED');
    expect(updatePassword).not.toHaveBeenCalled();
  });
});
