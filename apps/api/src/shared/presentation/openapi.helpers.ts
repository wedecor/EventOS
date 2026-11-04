import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiParam,
  ApiQuery,
  ApiResponse,
  type ApiBodyOptions,
  type ApiParamOptions,
  type ApiQueryOptions,
} from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

/**
 * Convert a Zod schema to an OpenAPI-compatible JSON Schema for Nest Swagger.
 * Zod remains the runtime validation source of truth (`ZodValidationPipe`).
 */
export function zodToOpenApiSchema(schema: ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  const { $schema: _ignored, ...rest } = json;
  return rest;
}

export function ApiZodBody(
  schema: ZodType,
  options: Omit<ApiBodyOptions, 'schema'> = {},
) {
  return ApiBody({
    ...options,
    schema: zodToOpenApiSchema(schema),
  });
}

export function ApiZodQuery(
  name: string,
  schema: ZodType,
  options: Omit<ApiQueryOptions, 'name' | 'schema'> = {},
) {
  return ApiQuery({
    name,
    ...options,
    schema: zodToOpenApiSchema(schema),
  });
}

/** Standard Event OS error envelope (`resultToResponse` / `AllExceptionsFilter`). */
export const OPENAPI_ERROR_ENVELOPE: Record<string, unknown> = {
  type: 'object',
  properties: {
    code: { type: 'string', example: 'VALIDATION_ERROR' },
    message: { type: 'string' },
    details: {
      description: 'Optional structured details (validation issues, etc.)',
      nullable: true,
    },
  },
  required: ['code', 'message'],
};

export function dataEnvelopeSchema(
  dataSchema: Record<string, unknown> = {
    type: 'object',
    additionalProperties: true,
  },
): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      data: dataSchema,
    },
    required: ['data'],
  };
}

export function ApiDataResponse(
  status: number,
  description: string,
  dataSchema?: Record<string, unknown>,
) {
  return ApiResponse({
    status,
    description,
    schema: dataEnvelopeSchema(dataSchema),
  });
}

/** Common HTTP error responses for Result → HttpException mapping. */
export function ApiStandardErrors() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Validation error (`VALIDATION_ERROR`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 401,
      description:
        'Unauthenticated (`INVALID_CREDENTIALS` / `UNAUTHENTICATED`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden (`FORBIDDEN`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 404,
      description: 'Not found (`NOT_FOUND`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 409,
      description:
        'Conflict (`CONCURRENT_MODIFICATION`, `INVALID_STATE`, `DUPLICATE_*`, …)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 422,
      description: 'Business rule violation (`EP1-BR-001` / `002` / `003`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limited (`RATE_LIMITED`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
    ApiResponse({
      status: 501,
      description: 'Not implemented (`NOT_IMPLEMENTED`)',
      schema: OPENAPI_ERROR_ENVELOPE,
    }),
  );
}

/**
 * Optimistic concurrency header used by `@IfMatchVersion()`.
 * When required, missing/invalid If-Match yields application validation failure.
 */
export function ApiIfMatchHeader(required = false) {
  return ApiHeader({
    name: 'If-Match',
    required,
    description:
      'Resource version for optimistic concurrency (quoted integer, e.g. `"1"`).',
    schema: { type: 'string', example: '"1"' },
  });
}

export function ApiUuidParam(
  name: string,
  options: Omit<ApiParamOptions, 'name' | 'schema'> = {},
) {
  return ApiParam({
    name,
    required: true,
    ...options,
    schema: { type: 'string', format: 'uuid' },
  });
}
