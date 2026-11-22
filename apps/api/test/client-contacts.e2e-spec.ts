import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { ContactApplicationService } from '../src/modules/customer/application/services/contact.application.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CUSTOMER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONTACT_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

/**
 * EP1-CUS-001 — Customer Contacts API (`docs/09` §Customer POST /clients/:id/contacts).
 * Application service stubbed so HTTP/auth/validation can be asserted without a DB.
 */
describe('Customer Contacts API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const contactService = {
    addContact: jest.fn(),
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
      .overrideProvider(ContactApplicationService)
      .useValue(contactService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    contactService.addContact.mockResolvedValue(
      success({ id: CONTACT_ID, contactsCount: 2 }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /clients/:id/contacts requires authentication', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/contacts`)
      .send({
        name: 'Priya',
        role: 'bride',
        phone: { countryCode: '+91', number: '9876543210' },
      })
      .expect(401);
  });

  it('POST /clients/:id/contacts returns docs/09 { id, contactsCount }', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/contacts`)
      .set('Authorization', bearerFor('sales_manager'))
      .send({
        name: 'Priya Sharma',
        role: 'bride',
        phone: { countryCode: '+91', number: '9876543210' },
        email: { value: 'Priya@Example.com' },
      })
      .expect(201);

    const body = response.body as {
      data: { id: string; contactsCount: number };
    };
    expect(body.data).toEqual({ id: CONTACT_ID, contactsCount: 2 });
    expect(contactService.addContact).toHaveBeenCalledWith(
      TENANT_ID,
      CUSTOMER_ID,
      expect.objectContaining({
        name: 'Priya Sharma',
        role: 'bride',
        phone: '+919876543210',
        email: 'priya@example.com',
      }),
    );
  });

  it('POST /clients/:id/contacts forbids roles without clients:write', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/contacts`)
      .set('Authorization', bearerFor('viewer'))
      .send({
        name: 'Priya',
        role: 'bride',
        phone: { countryCode: '+91', number: '9876543210' },
      })
      .expect(403);
  });

  it('POST /clients/:id/contacts rejects body without phone and email', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/contacts`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({
        name: 'Priya',
        role: 'bride',
      })
      .expect(400);

    expect(contactService.addContact).not.toHaveBeenCalled();
  });
});
