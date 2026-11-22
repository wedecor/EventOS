import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { InventoryApplicationService } from '../src/modules/inventory/application/services/inventory.application.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const inventoryItemDto = {
  id: '22222222-2222-2222-2222-222222222222',
  tenantId: TENANT_ID,
  name: 'Backdrop Frame',
  sku: 'BF-001',
  category: 'frames',
  taxonomy: 'reusable' as const,
  unit: 'piece',
  condition: 'good' as const,
  quantityAtJpNagar: 4,
  status: 'active' as const,
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  version: 1,
};

/**
 * EP1-INV-001 / EP1-INV-002 — Inventory Item Master API
 * (`docs/09-api-design.md` §Inventory item master).
 */
describe('Inventory Item Master API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const inventoryService = {
    listItems: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
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
      .overrideProvider(InventoryApplicationService)
      .useValue(inventoryService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    inventoryService.listItems.mockResolvedValue(success([inventoryItemDto]));
    inventoryService.createItem.mockResolvedValue(success(inventoryItemDto));
    inventoryService.updateItem.mockResolvedValue(
      success({
        ...inventoryItemDto,
        quantityAtJpNagar: 2,
        status: 'inactive',
        version: 2,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/inventory/items requires authentication', () => {
    return request(app.getHttpServer())
      .get('/api/v1/inventory/items')
      .expect(401);
  });

  it('GET /api/v1/inventory/items allows inventory:read (viewer)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/inventory/items')
      .set('Authorization', bearerFor('viewer'))
      .expect(200);

    const body = response.body as { data: unknown[] };
    expect(body.data).toHaveLength(1);
    expect(inventoryService.listItems).toHaveBeenCalled();
  });

  it('POST /api/v1/inventory/items creates an inventory item', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/inventory/items')
      .set('Authorization', bearerFor('operations_manager'))
      .send({
        name: 'Backdrop Frame',
        sku: 'BF-001',
        category: 'frames',
        taxonomy: 'reusable',
        unit: 'piece',
        condition: 'good',
        quantityAtJpNagar: 4,
      })
      .expect(201);

    const body = response.body as { data: { id: string; taxonomy: string } };
    expect(body.data.id).toBe(inventoryItemDto.id);
    expect(body.data.taxonomy).toBe('reusable');
    expect(inventoryService.createItem).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({
        name: 'Backdrop Frame',
        taxonomy: 'reusable',
        quantityAtJpNagar: 4,
      }),
    );
  });

  it('POST /api/v1/inventory/items rejects roles without inventory:write', () => {
    return request(app.getHttpServer())
      .post('/api/v1/inventory/items')
      .set('Authorization', bearerFor('viewer'))
      .send({
        name: 'Backdrop Frame',
        category: 'frames',
        taxonomy: 'reusable',
        unit: 'piece',
      })
      .expect(403);
  });

  it('PATCH /api/v1/inventory/items/:id requires If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/inventory/items/${inventoryItemDto.id}`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({ status: 'retired' })
      .expect(400);

    const body = response.body as {
      code?: string;
      error?: { code?: string };
    };
    expect(body.code ?? body.error?.code).toBe('VALIDATION_ERROR');
    expect(inventoryService.updateItem).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/inventory/items/:id updates all mutable fields with If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/inventory/items/${inventoryItemDto.id}`)
      .set('Authorization', bearerFor('owner'))
      .set('If-Match', '1')
      .send({
        name: 'Backdrop Frame XL',
        sku: null,
        category: 'frames',
        taxonomy: 'consumable',
        unit: 'set',
        condition: 'fair',
        quantityAtJpNagar: 2,
        status: 'inactive',
      })
      .expect(200);

    const body = response.body as {
      data: { status: string; quantityAtJpNagar: number };
    };
    expect(body.data.status).toBe('inactive');
    expect(body.data.quantityAtJpNagar).toBe(2);
    expect(inventoryService.updateItem).toHaveBeenCalledWith(
      TENANT_ID,
      inventoryItemDto.id,
      expect.objectContaining({
        name: 'Backdrop Frame XL',
        taxonomy: 'consumable',
        quantityAtJpNagar: 2,
        status: 'inactive',
      }),
      1,
    );
  });
});
