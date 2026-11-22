import { execFileSync } from 'node:child_process';

const CONTAINER = process.env.E2E_POSTGRES_CONTAINER ?? 'eventos-postgres-e2e';
const DB_USER = process.env.E2E_POSTGRES_USER ?? 'eventos';
const DB_NAME = process.env.E2E_POSTGRES_DB ?? 'eventos_e2e';

function sql(query: string): string {
  return execFileSync(
    'docker',
    [
      'exec',
      CONTAINER,
      'psql',
      '-U',
      DB_USER,
      '-d',
      DB_NAME,
      '-At',
      '-F',
      '|',
      '-c',
      query,
    ],
    { encoding: 'utf8' },
  ).trim();
}

export function dbCount(query: string): number {
  const raw = sql(query);
  const n = Number(raw.split('\n')[0] ?? '0');
  if (!Number.isFinite(n)) {
    throw new Error(`dbCount expected number, got: ${raw}`);
  }
  return n;
}

export function dbOne(query: string): string | null {
  const raw = sql(query);
  if (!raw) return null;
  return raw.split('\n')[0] ?? null;
}

function split3(row: string): [string, string, string] {
  const parts = row.split('|');
  const a = parts[0];
  const b = parts[1];
  const c = parts[2];
  if (a === undefined || b === undefined || c === undefined) {
    throw new Error(`Expected 3 pipe-separated fields, got: ${row}`);
  }
  return [a, b, c];
}

function split2(row: string): [string, string] {
  const parts = row.split('|');
  const a = parts[0];
  const b = parts[1];
  if (a === undefined || b === undefined) {
    throw new Error(`Expected 2 pipe-separated fields, got: ${row}`);
  }
  return [a, b];
}

export function assertCommunicationForQuotation(
  quotationId: string,
): { id: string; status: string; provider: string } {
  const row = dbOne(
    `SELECT id || '|' || status::text || '|' || coalesce(provider,'') FROM communication_records WHERE quotation_id = '${quotationId}' AND deleted_at IS NULL ORDER BY occurred_at DESC LIMIT 1`,
  );
  if (!row) {
    throw new Error(`No communication_records for quotation ${quotationId}`);
  }
  const [id, status, provider] = split3(row);
  return { id, status, provider };
}

export function assertCommunicationForInvoice(
  invoiceId: string,
): { id: string; status: string; provider: string } {
  const row = dbOne(
    `SELECT id || '|' || status::text || '|' || coalesce(provider,'') FROM communication_records WHERE invoice_id = '${invoiceId}' AND deleted_at IS NULL ORDER BY occurred_at DESC LIMIT 1`,
  );
  if (!row) {
    throw new Error(`No communication_records for invoice ${invoiceId}`);
  }
  const [id, status, provider] = split3(row);
  return { id, status, provider };
}

export function assertStoredDocumentForBooking(
  bookingId: string,
  fileNameHint: string,
): { id: string; fileName: string } {
  const row = dbOne(
    `SELECT id || '|' || file_name FROM stored_documents WHERE booking_id = '${bookingId}' AND deleted_at IS NULL AND file_name ILIKE '%${fileNameHint.replace(/'/g, "''")}%' ORDER BY uploaded_at DESC LIMIT 1`,
  );
  if (!row) {
    throw new Error(
      `No stored_documents for booking ${bookingId} matching ${fileNameHint}`,
    );
  }
  const [id, fileName] = split2(row);
  return { id, fileName };
}

export function assertIntegrationSecretsMaskedInDb(tenantId: string): void {
  const row = dbOne(
    `SELECT email_secret_configured::text || '|' || storage_secret_configured::text || '|' || coalesce(length(smtp_password_encrypted),0)::text || '|' || coalesce(smtp_password_encrypted,'') FROM integration_settings WHERE tenant_id = '${tenantId}'`,
  );
  if (!row) {
    throw new Error(`No integration_settings for tenant ${tenantId}`);
  }
  const parts = row.split('|');
  const emailConfigured = parts[0] ?? '';
  const encLen = Number(parts[2] ?? '0');
  const enc = parts[3] ?? '';
  if (emailConfigured !== 't' && emailConfigured !== 'true') {
    throw new Error('Expected email_secret_configured after secret update');
  }
  if (encLen <= 0) {
    throw new Error('Expected encrypted smtp password in DB');
  }
  if (enc.includes('M3-Secret')) {
    throw new Error('Plaintext secret leaked into smtp_password_encrypted');
  }
}
