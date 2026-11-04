// R2-06 — Sentry must initialize before any other application imports.
import { resolveSentryDsn } from './instrument';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common';
import type { EnvConfig } from './config';
import {
  buildPhase1OpenApiConfig,
  finalizePhase1OpenApiDocument,
} from './shared/presentation/openapi.document';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });
  const sentryDsn = configService.get('SENTRY_DSN', { infer: true });

  // cross-origin: Admin Portal is a separate origin (local :3001 / app.* vs api.*).
  // Helmet's default CORP "same-origin" blocks credentialed browser reads across origins.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  // Required to read the HTTP-only refresh-token cookie (ADR-008).
  app.use(cookieParser());
  app.use(
    cors({
      origin:
        corsOrigin === '*'
          ? true
          : corsOrigin.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  // docs/09 §Phase 1 OpenAPI Contract Freeze / docs/18: Swagger is for
  // development and staging — not exposed in production.
  if (nodeEnv !== 'production') {
    const document = finalizePhase1OpenApiDocument(
      SwaggerModule.createDocument(app, buildPhase1OpenApiConfig()),
    );
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs/json',
    });
    logger.log(`Swagger UI available at http://localhost:${port}/docs`);
    logger.log(`OpenAPI JSON available at http://localhost:${port}/docs/json`);
  } else {
    logger.log('Swagger UI disabled in production (docs/09 / docs/18).');
  }

  await app.listen(port);

  logger.log(`Event OS API listening on port ${port} (${nodeEnv})`);
  if (sentryDsn && resolveSentryDsn(sentryDsn)) {
    logger.log('Sentry error tracking is enabled.');
  }
}

bootstrap().catch((error: unknown) => {
  // R2-06 — bootstrap failures are process-level; report when Sentry is enabled.
  Sentry.captureException(error);
  console.error('Failed to start Event OS API', error);
  process.exit(1);
});
