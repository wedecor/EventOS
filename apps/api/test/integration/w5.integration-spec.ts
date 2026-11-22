import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { REDIS_CLIENT } from '../../src/database/redis.constants';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

async function loginAccessToken(app: INestApplication<App>): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@wedecor.events',
      password: 'ChangeMe!EventOS1',
    })
    .expect(201);

  const body = response.body as { data: { accessToken: string } };
  return body.data.accessToken;
}

(runIntegration ? describe : describe.skip)(
  'W5 happy path (integration)',
  () => {
    let app: INestApplication<App>;
    let accessToken: string;

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
        .compile();

      app = moduleFixture.createNestApplication();
      app.use(cookieParser());
      app.setGlobalPrefix('api/v1', {
        exclude: ['health', 'health/ready'],
      });
      await app.init();

      accessToken = await loginAccessToken(app);
    });

    afterAll(async () => {
      await app.close();
    });

    it('runs client → quotation → payment → booking → lead approved over HTTP', async () => {
      const auth = { Authorization: `Bearer ${accessToken}` };

      const clientResponse = await request(app.getHttpServer())
        .post('/api/v1/clients')
        .set(auth)
        .send({
          displayName: `Integration Client ${Date.now()}`,
          primaryPhone: '+919876543210',
        })
        .expect(201);

      const clientId = (clientResponse.body as { data: { id: string } }).data
        .id;

      const leadResponse = await request(app.getHttpServer())
        .post('/api/v1/leads')
        .set(auth)
        .send({
          customerId: clientId,
          source: 'website',
          eventType: 'wedding',
        })
        .expect(201);

      const lead = (
        leadResponse.body as { data: { id: string; version: number } }
      ).data;

      const leadsWithCustomer = await request(app.getHttpServer())
        .get('/api/v1/leads?include=customer')
        .set(auth)
        .expect(200);

      const enriched = (
        leadsWithCustomer.body as {
          data: { id: string; customerDisplayName?: string }[];
        }
      ).data.find((row) => row.id === lead.id);
      expect(enriched?.customerDisplayName).toBeTruthy();

      await request(app.getHttpServer())
        .post(`/api/v1/leads/${lead.id}/follow-ups`)
        .set(auth)
        .send({
          dueAt: new Date(Date.now() + 86_400_000).toISOString(),
          notes: 'Integration follow-up',
        })
        .expect(201);

      const followUps = await request(app.getHttpServer())
        .get(`/api/v1/leads/${lead.id}/follow-ups`)
        .set(auth)
        .expect(200);

      expect(
        (followUps.body as { data: unknown[] }).data.length,
      ).toBeGreaterThanOrEqual(1);

      await request(app.getHttpServer())
        .patch(`/api/v1/leads/${lead.id}/stage`)
        .set(auth)
        .send({ stage: 'in_talks', version: lead.version })
        .expect(200);

      const quotationResponse = await request(app.getHttpServer())
        .post('/api/v1/quotations')
        .set(auth)
        .send({
          customerId: clientId,
          leadId: lead.id,
          validUntil: '2099-12-31',
        })
        .expect(201);

      const quotation = (
        quotationResponse.body as {
          data: { id: string; version: number };
        }
      ).data;

      const clientsList = await request(app.getHttpServer())
        .get('/api/v1/clients')
        .set(auth)
        .expect(200);

      const clientIds = (
        clientsList.body as { data: { id: string }[] }
      ).data.map((c) => c.id);
      expect(clientIds).toContain(clientId);

      const latestQuotation = await request(app.getHttpServer())
        .get(`/api/v1/leads/${lead.id}/quotation`)
        .set(auth)
        .expect(200);

      expect(
        (latestQuotation.body as { data: { id: string } | null }).data?.id,
      ).toBe(quotation.id);

      await request(app.getHttpServer())
        .post(`/api/v1/quotations/${quotation.id}/line-items`)
        .set(auth)
        .send({
          description: 'Stage decor package',
          quantity: 1,
          unitPrice: 150000,
        })
        .expect(201);

      const lineItemsResponse = await request(app.getHttpServer())
        .get(`/api/v1/quotations/${quotation.id}/line-items`)
        .set(auth)
        .expect(200);

      expect(
        (lineItemsResponse.body as { data: unknown[] }).data.length,
      ).toBeGreaterThanOrEqual(1);

      const quotationAfterLineItem = await request(app.getHttpServer())
        .get(`/api/v1/quotations/${quotation.id}`)
        .set(auth)
        .expect(200);

      const quotationVersion = (
        quotationAfterLineItem.body as { data: { version: number } }
      ).data.version;

      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set(auth)
        .send({
          leadId: lead.id,
          quotationId: quotation.id,
          amount: 50000,
          method: 'upi',
          receivedAt: new Date().toISOString(),
          paymentType: 'advance',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/quotations/${quotation.id}/send`)
        .set(auth)
        .send({ version: quotationVersion })
        .expect(201);

      const sentQuotation = await request(app.getHttpServer())
        .get(`/api/v1/quotations/${quotation.id}`)
        .set(auth)
        .expect(200);

      const sentVersion = (sentQuotation.body as { data: { version: number } })
        .data.version;

      await request(app.getHttpServer())
        .post(`/api/v1/quotations/${quotation.id}/approve`)
        .set(auth)
        .send({ version: sentVersion })
        .expect(201);

      const bookingResponse = await request(app.getHttpServer())
        .post(`/api/v1/bookings/from-quotation/${quotation.id}`)
        .set(auth)
        .expect(201);

      expect(
        (bookingResponse.body as { data: { id: string } }).data.id,
      ).toBeTruthy();

      const leadBeforeApprove = await request(app.getHttpServer())
        .get(`/api/v1/leads/${lead.id}`)
        .set(auth)
        .expect(200);

      const leadVersion = (
        leadBeforeApprove.body as { data: { version: number } }
      ).data.version;

      const approvedLead = await request(app.getHttpServer())
        .patch(`/api/v1/leads/${lead.id}/stage`)
        .set(auth)
        .send({ stage: 'approved', version: leadVersion })
        .expect(200);

      expect(
        (approvedLead.body as { data: { stage: string } }).data.stage,
      ).toBe('approved');
    });
  },
);
