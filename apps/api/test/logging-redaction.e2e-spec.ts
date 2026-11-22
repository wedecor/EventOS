import { Writable } from 'node:stream';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PARAMS_PROVIDER_TOKEN } from 'nestjs-pino';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule, LOG_REDACT_CONFIG } from '../src/app.module';
import { generateRequestId } from '../src/config/logging.config';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { LeadApplicationService } from '../src/modules/lead/application/services/lead.application.service';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * R1-03 (docs/14 §Sensitive Data Classification) — verifies the real,
 * globally-registered `LoggerModule.forRoot()` pino-http middleware redacts
 * the bearer access token from the log line it emits for a genuine
 * authenticated request, using the exact `LOG_REDACT_CONFIG` shipped in
 * `app.module.ts` (not a re-implementation).
 *
 * The app's pino `transport` (pino-pretty) is replaced with a synchronous
 * in-memory stream via the `PARAMS_PROVIDER_TOKEN` override so log output is
 * plain JSON and can be inspected deterministically, without a worker-thread
 * transport in the loop.
 */
describe('Request log redaction (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;
  let logLines: string[];

  beforeAll(async () => {
    logLines = [];
    const captureStream = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        logLines.push(chunk.toString());
        callback();
      },
    });

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
      .overrideProvider(LeadApplicationService)
      .useValue({ listLeads: jest.fn().mockResolvedValue(success([])) })
      .overrideProvider(PARAMS_PROVIDER_TOKEN)
      .useValue({
        pinoHttp: {
          redact: LOG_REDACT_CONFIG,
          stream: captureStream,
          autoLogging: true,
          genReqId: generateRequestId,
          customProps: (req: { id: string }) => ({
            service: 'event-os-api',
            requestId: req.id,
          }),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    logLines = [];
  });

  it('does not leak the bearer access token in the request log line', async () => {
    const accessToken = tokenService.signAccessToken({
      userId: 'user-1',
      tenantId: TENANT_ID,
      email: 'viewer@wedecor.test',
      role: 'viewer',
    });

    await request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const output = logLines.join('');
    expect(output).not.toContain(accessToken);
    expect(output).toContain('[Redacted]');
    // The log line is still useful — method/url are unaffected by redaction.
    expect(output).toContain('/api/v1/leads');
  });

  it('does not leak an invalid bearer token either, on a rejected request', async () => {
    const suppliedToken = 'not-a-real-but-still-secret-looking-token';

    await request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', `Bearer ${suppliedToken}`)
      .expect(401);

    const output = logLines.join('');
    expect(output).not.toContain(suppliedToken);
  });

  it('logs requests without an Authorization header unaffected', async () => {
    await request(app.getHttpServer()).get('/api/v1/leads').expect(401);

    const output = logLines.join('');
    expect(output).toContain('/api/v1/leads');
  });

  it('preserves correlation via x-request-id on the response (R2-07)', async () => {
    const correlationId = 'e2e-corr-logging-1';

    const res = await request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('x-request-id', correlationId)
      .expect(401);

    expect(res.headers['x-request-id']).toBe(correlationId);

    const output = logLines.join('');
    expect(output).toContain(correlationId);
    // Top-level requestId field for aggregator queries.
    expect(output).toMatch(/"requestId"\s*:\s*"e2e-corr-logging-1"/);
  });
});
