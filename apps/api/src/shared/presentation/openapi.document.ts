import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

/**
 * Shared OpenAPI DocumentBuilder for runtime Swagger UI and the frozen export.
 * Phase 1 contract freeze (R3-13): paths/methods/permissions are frozen; see
 * docs/09-api-design.md §Phase 1 OpenAPI Contract Freeze.
 */
export function buildPhase1OpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('Event OS API')
    .setDescription(
      [
        'We Decor Event OS **Phase 1** REST API (frozen contract — R3-13).',
        '',
        '## Authentication',
        '- Bearer JWT access token (`Authorization: Bearer <token>`).',
        '- Refresh token: HTTP-only cookie `refresh_token` (path `/api/v1/auth`) or optional body field.',
        '- Public: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /health`, `GET /health/ready`.',
        '- `POST /api/v1/auth/logout` and `POST /api/v1/auth/change-password` require JWT (no `@Permissions`).',
        '',
        '## Conventions',
        '- Global prefix `/api/v1` (except health).',
        '- Success envelope: `{ "data": T }`.',
        '- Error envelope: `{ "code", "message", "details?" }`.',
        '- Tenant is Phase-1 hardcoded (ADR-016) — never send `tenantId` in bodies.',
        '- Optimistic concurrency: `If-Match` header with quoted version integer where documented.',
        '- Permissions: see docs/09 role × permission matrix / `rbac.ts`.',
        '',
        '## Explicitly out of Phase 1 OpenAPI surface',
        '- `GET /api/v1/clients` (list) — not shipped.',
        '- `POST /api/v1/inventory/movements/:id/photos` — deferred (`inventory:photos:write` unbound).',
        '- Audit log HTTP API, Attachment upload pipeline, multi-tenant SaaS.',
        '',
        'Breaking contract changes require explicit approval after freeze.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from POST /api/v1/auth/login (15m TTL).',
      },
      'bearer',
    )
    .addCookieAuth(
      'refresh_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'refresh_token',
        description:
          'HTTP-only refresh cookie (ADR-008). Path `/api/v1/auth`. Used by refresh/logout.',
      },
      'refresh_token',
    )
    .addServer('http://localhost:3000', 'Local development (default PORT)')
    .addServer('http://localhost:4000', 'Docker Compose API mapping')
    .build();
}

/** Operations that must not require bearer in the OpenAPI document. */
const PUBLIC_OPERATION_PATHS = new Set([
  'post:/api/v1/auth/login',
  'post:/api/v1/auth/refresh',
  'get:/health',
  'get:/health/ready',
]);

/**
 * Apply global bearer security, then clear it for Public routes.
 * Controllers may still declare `@ApiBearerAuth()`; this normalizes the document.
 */
export function finalizePhase1OpenApiDocument(
  document: OpenAPIObject,
): OpenAPIObject {
  const paths = document.paths ?? {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    for (const method of [
      'get',
      'put',
      'post',
      'delete',
      'options',
      'head',
      'patch',
      'trace',
    ] as const) {
      const operation = pathItem[method];
      if (!operation) {
        continue;
      }

      const key = `${method}:${path}`;
      if (PUBLIC_OPERATION_PATHS.has(key)) {
        operation.security = [];
      } else if (!operation.security) {
        operation.security = [{ bearer: [] }];
      }
    }
  }

  document.components = document.components ?? {};
  document.components.schemas = {
    ...document.components.schemas,
    ErrorEnvelope: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string' },
        details: { nullable: true },
      },
      required: ['code', 'message'],
    },
  };

  return document;
}
