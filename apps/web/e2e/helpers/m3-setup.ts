import { apiJson } from './api';

export type M3Fixtures = {
  tenantId: string;
  quotationId: string;
  bookingId: string;
  customerId: string;
  recipientEmail: string;
};

/**
 * Ensure an existing quotation/booking pair is email-ready (customer has primary email).
 * Prefers approved/completed bookings already in eventos_e2e.
 */
export async function ensureM3Fixtures(): Promise<M3Fixtures> {
  const recipientEmail = `m3.recipient.${Date.now()}@example.test`;

  const bookings = await apiJson<{
    data: Array<{
      id: string;
      quotationId: string;
      customerId: string;
      status: string;
    }>;
  }>('/api/v1/bookings?page=1&pageSize=20&sort=createdAt&order=desc');

  const hit =
    bookings.data.find((row) =>
      ['approved', 'completed', 'in_progress', 'confirmed'].includes(row.status),
    ) ?? bookings.data[0];

  if (!hit?.quotationId || !hit.customerId) {
    throw new Error(
      'No existing booking/quotation in e2e DB. Seed and run M2 workflow first.',
    );
  }

  const customer = await apiJson<{
    data: {
      id: string;
      version: number;
      primaryEmail?: string | null;
      email?: string | null;
      displayName?: string;
      name?: string;
    };
  }>(`/api/v1/clients/${hit.customerId}`);

  // Always rotate recipient email so M3 re-runs avoid in-memory duplicate-send
  // prevention (MAIL_IDEMPOTENCY_WINDOW_SEC) for the same quotation:recipient key.
  await apiJson(`/api/v1/clients/${hit.customerId}`, {
    method: 'PATCH',
    headers: { 'If-Match': `"${customer.data.version}"` },
    body: JSON.stringify({
      email: recipientEmail,
    }),
  });

  const refreshed = await apiJson<{
    data: { primaryEmail?: string | null; email?: string | null };
  }>(`/api/v1/clients/${hit.customerId}`);

  const settings = await apiJson<{ data: { tenantId: string } }>(
    '/api/v1/settings',
  );

  const fixtures: M3Fixtures = {
    tenantId: settings.data.tenantId,
    quotationId: hit.quotationId,
    bookingId: hit.id,
    customerId: hit.customerId,
    recipientEmail:
      refreshed.data.primaryEmail?.trim() ||
      refreshed.data.email?.trim() ||
      recipientEmail,
  };

  return fixtures;
}
