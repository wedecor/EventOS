/**
 * R3-13 — Export the Phase 1 frozen OpenAPI document to disk.
 *
 * Compiled with the Nest app so decorator metadata is available:
 *   pnpm openapi:export  →  builds then runs dist/src/openapi-export.js
 *
 * Writes: openapi/openapi.v1.json (repo root of apps/api)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  buildPhase1OpenApiConfig,
  finalizePhase1OpenApiDocument,
} from './shared/presentation/openapi.document';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/ready'],
  });

  const document = finalizePhase1OpenApiDocument(
    SwaggerModule.createDocument(app, buildPhase1OpenApiConfig()),
  );

  // dist/src → apps/api/openapi
  const outPath = join(__dirname, '..', '..', 'openapi', 'openapi.v1.json');
  mkdirSync(join(__dirname, '..', '..', 'openapi'), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  process.stdout.write(`Wrote Phase 1 OpenAPI freeze artifact: ${outPath}\n`);
}

exportOpenApi().catch((error: unknown) => {
  process.stderr.write(
    `OpenAPI export failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
