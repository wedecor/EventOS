import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { StaffApplicationService } from '../src/modules/staff/application/services/staff.application.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const staffMemberDto = {
  id: '11111111-1111-1111-1111-111111111111',
  tenantId: TENANT_ID,
  name: 'Ravi Kumar',
  role: 'decorator',
  department: 'operations',
  phone: '+919876543210',
  email: 'ravi@wedecor.test',
  status: 'active' as const,
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  version: 1,
};

/**
 * EP1-STF-001 — Staff Master API contract (`docs/09-api-design.md` §Staff Management).
 * Application service is stubbed so HTTP/auth/validation can be asserted without a DB.
 */
describe('Staff Master API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const staffService = {
    listStaffMembers: jest.fn(),
    getStaffMemberById: jest.fn(),
    createStaffMember: jest.fn(),
    updateStaffMember: jest.fn(),
  };

  const bearerFor = (role: string): string => {
    const accessToken = tokenService.signAccessToken({
      userId: 'user-1',
      tenantId: TENANT_ID,
      email: `${role}@wedecor.test`,
      role,
    });
    return `Bearer ${accessToken}`;
  };

  beforeAll(async () => {
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
      .overrideProvider(StaffApplicationService)
      .useValue(staffService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    staffService.listStaffMembers.mockResolvedValue(success([staffMemberDto]));
    staffService.getStaffMemberById.mockResolvedValue(success(staffMemberDto));
    staffService.createStaffMember.mockResolvedValue(success(staffMemberDto));
    staffService.updateStaffMember.mockResolvedValue(
      success({ ...staffMemberDto, status: 'on_leave', version: 2 }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/staff requires authentication', () => {
    return request(app.getHttpServer()).get('/api/v1/staff').expect(401);
  });

  it('GET /api/v1/staff allows staff:read (viewer)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/staff')
      .set('Authorization', bearerFor('viewer'))
      .expect(200);

    const body = response.body as { data: unknown[] };
    expect(body.data).toHaveLength(1);
    expect(staffService.listStaffMembers).toHaveBeenCalled();
  });

  it('GET /api/v1/staff/:id returns a staff member', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/staff/${staffMemberDto.id}`)
      .set('Authorization', bearerFor('operations_manager'))
      .expect(200);

    const body = response.body as { data: { id: string } };
    expect(body.data.id).toBe(staffMemberDto.id);
  });

  it('POST /api/v1/staff creates a staff member with nested phone/email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/staff')
      .set('Authorization', bearerFor('operations_manager'))
      .send({
        name: 'Ravi Kumar',
        role: 'decorator',
        department: 'operations',
        phone: { countryCode: '+91', number: '9876543210' },
        email: { value: 'ravi@wedecor.test' },
        status: 'active',
      })
      .expect(201);

    const body = response.body as { data: { id: string } };
    expect(body.data.id).toBe(staffMemberDto.id);
    expect(staffService.createStaffMember).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({
        name: 'Ravi Kumar',
        phone: '+919876543210',
        email: 'ravi@wedecor.test',
      }),
    );
  });

  it('POST /api/v1/staff rejects roles without staff:write', () => {
    return request(app.getHttpServer())
      .post('/api/v1/staff')
      .set('Authorization', bearerFor('viewer'))
      .send({
        name: 'Ravi Kumar',
        role: 'decorator',
        phone: { countryCode: '+91', number: '9876543210' },
      })
      .expect(403);
  });

  it('PATCH /api/v1/staff/:id requires If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/staff/${staffMemberDto.id}`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({ status: 'on_leave' })
      .expect(400);

    const body = response.body as {
      code?: string;
      error?: { code?: string };
    };
    expect(body.code ?? body.error?.code).toBe('VALIDATION_ERROR');
    expect(staffService.updateStaffMember).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/staff/:id updates mutable fields with If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/staff/${staffMemberDto.id}`)
      .set('Authorization', bearerFor('owner'))
      .set('If-Match', '1')
      .send({
        name: 'Ravi K',
        role: 'on_site_lead',
        department: null,
        phone: { countryCode: '+91', number: '9000000000' },
        email: { value: 'ravi.k@wedecor.test' },
        status: 'on_leave',
      })
      .expect(200);

    const body = response.body as { data: { status: string } };
    expect(body.data.status).toBe('on_leave');
    expect(staffService.updateStaffMember).toHaveBeenCalledWith(
      TENANT_ID,
      staffMemberDto.id,
      expect.objectContaining({
        name: 'Ravi K',
        role: 'on_site_lead',
        department: null,
        phone: '+919000000000',
        email: 'ravi.k@wedecor.test',
        status: 'on_leave',
      }),
      1,
    );
  });
});
