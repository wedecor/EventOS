import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common';
import type { EnvConfig } from './config';

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

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Event OS API')
    .setDescription(
      'We Decor Phase 1 REST API — Sprint 1 (W5 Lead → Booking) business endpoints.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
  });

  await app.listen(port);

  logger.log(`Event OS API listening on port ${port} (${nodeEnv})`);
  logger.log(`Swagger UI available at http://localhost:${port}/docs`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start Event OS API', error);
  process.exit(1);
});
