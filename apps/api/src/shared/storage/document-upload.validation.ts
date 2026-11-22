import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadValidationInput = {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  maxBytes?: number;
};

export type UploadValidationResult =
  | { ok: true; safeFileName: string; extension: string }
  | { ok: false; code: 'VALIDATION_ERROR'; message: string };

export function validateDocumentUpload(
  input: UploadValidationInput,
): UploadValidationResult {
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_UPLOAD_BYTES;
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(input.mimeType as never)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: `MIME type not allowed: ${input.mimeType}`,
    };
  }
  if (input.sizeBytes <= 0) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'File is empty.',
    };
  }
  if (input.sizeBytes > maxBytes) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: `File exceeds maximum size of ${maxBytes} bytes.`,
    };
  }

  const rawName = input.originalName?.trim() || 'document';
  const base = rawName
    .replace(/[/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9._\- ()]/g, '_')
    .slice(0, 180);
  const expectedExt = MIME_TO_EXT[input.mimeType] ?? '';
  const incomingExt = extname(base).toLowerCase();
  const allowedExts = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);
  if (incomingExt && !allowedExts.has(incomingExt)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: `File extension not allowed: ${incomingExt}`,
    };
  }

  const safeFileName =
    incomingExt || !expectedExt
      ? base || `document${expectedExt}`
      : `${base}${expectedExt}`;

  return {
    ok: true,
    safeFileName,
    extension: expectedExt || incomingExt || '',
  };
}

export function buildStorageKey(
  tenantId: string,
  extension: string,
  now = new Date(),
): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const ext = extension.startsWith('.')
    ? extension
    : extension
      ? `.${extension}`
      : '';
  return `${tenantId}/${yyyy}/${mm}/${randomUUID()}${ext}`;
}
