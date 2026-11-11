import { expect, test } from '@playwright/test';
import {
  assertEntityExists,
  findBookingIdByQuotation,
} from './helpers/api';
import { idFromUrl, loginAsAdmin } from './helpers/auth';
import { e2eCredentials } from './helpers/env';

/**
 * M0/M1 12-step operational workflow (UI → API → DB).
 * Skips when admin password env is unset so CI without seed creds stays green.
 */
test.describe('M0/M1 core operational workflow', () => {
  test.beforeEach(({ }, testInfo) => {
    if (!e2eCredentials()) {
      testInfo.skip(
        true,
        'Set E2E_ADMIN_PASSWORD or SEED_ADMIN_PASSWORD (and run seeded API + web).',
      );
    }
  });

  test('lead → quote → advance → booking → execution → complete → profitability', async ({
    page,
  }) => {
    const stamp = Date.now();
    await loginAsAdmin(page);

    // 1) Customer (required for quotation)
    await page.goto('/app/customers/new/');
    await page.getByLabel('Name').fill(`E2E Customer ${stamp}`);
    await page.getByLabel('Phone').fill(`9${String(stamp).slice(-9)}`);
    await page.getByRole('button', { name: 'Create customer' }).click();
    await page.waitForURL(/\/app\/customers\/view\/\?id=/);
    const customerId = idFromUrl(page);
    await assertEntityExists(`/api/v1/clients/${customerId}`);

    // 2) Lead creation
    await page.goto('/app/leads/new/');
    await page.getByLabel('Event type').fill('Wedding');
    await page.getByLabel('Venue').fill(`E2E Hall ${stamp}`);
    const start = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
    await page.getByLabel('Event start').fill(toDateInput(start));
    await page.getByLabel('Event end').fill(toDateInput(end));
    await page.getByLabel('Estimated budget (INR)').fill('150000');
    await page.getByLabel('Guest count').fill('200');
    await page.getByLabel('Notes').fill('E2E core workflow lead');
    await page.getByRole('button', { name: 'Create lead' }).click();
    await page.waitForURL(/\/app\/leads\/view\/\?id=/);
    const leadId = idFromUrl(page);
    await assertEntityExists(`/api/v1/leads/${leadId}`);

    // 3) Follow-up schedule + complete
    const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await page.getByLabel('Due at').fill(toDateTimeLocal(due));
    await page.getByRole('button', { name: 'Schedule follow-up' }).click();
    await expect(page.getByText('Follow-up scheduled')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Done' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).first().click();
    await expect(page.getByText('Follow-up marked done')).toBeVisible();

    // 4) Quotation creation
    await page.goto('/app/quotations/new/');
    await page.getByLabel('Customer ID').fill(customerId);
    await page.getByLabel('Lead ID').fill(leadId);
    await page
      .getByLabel('Valid until (optional)')
      .fill(toDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
    await page.getByRole('button', { name: 'Create quotation' }).click();
    await page.waitForURL(/\/app\/quotations\/view\/\?id=/);
    const quotationId = idFromUrl(page);
    await assertEntityExists(`/api/v1/quotations/${quotationId}`);

    // 5) Line item management
    await page.getByRole('button', { name: 'Add line' }).click();
    await page.getByLabel('Description').fill('Stage décor package');
    await page.getByLabel('Quantity').fill('1');
    await page.getByLabel(/Unit price/).fill('100000');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.getByText('Stage décor package')).toBeVisible();

    // 6) Send quotation
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Send', exact: true }).last().click();
    await expect(page.getByText(/sent/i).first()).toBeVisible({ timeout: 20_000 });

    // 7) Advance payment (quotation-scoped)
    await page.getByRole('button', { name: 'Record payment' }).click();
    await page.getByLabel('Amount').fill('25000');
    await page
      .getByLabel('Missing proof reason')
      .fill('E2E cash advance recorded offline');
    await page.getByRole('button', { name: 'Save payment' }).click();
    await expect(page.getByText('Confirmed advance on file')).toBeVisible({
      timeout: 20_000,
    });

    // 8) Approve → booking conversion
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).last().click();
    await expect(page.getByText(/Quotation approved/i).first()).toBeVisible({
      timeout: 30_000,
    });

    let bookingId: string | null = null;
    for (let i = 0; i < 20; i += 1) {
      bookingId = await findBookingIdByQuotation(quotationId);
      if (bookingId) break;
      await page.waitForTimeout(500);
    }
    expect(bookingId).toBeTruthy();
    bookingId = bookingId!;

    // 9) Event activation (approved → in_preparation)
    await page.goto(`/app/bookings/view/?id=${encodeURIComponent(bookingId)}`);
    await page.getByRole('button', { name: 'Start preparation' }).click();
    await page.getByRole('button', { name: /Start preparation|Confirm/i }).last().click();
    await expect(page.getByText(/in_preparation|in preparation/i).first()).toBeVisible({
      timeout: 20_000,
    });

    // 10) Event execution (in_preparation → in_execution)
    await page.getByRole('button', { name: 'Start execution' }).click();
    await page.getByRole('button', { name: 'Start execution' }).last().click();
    await expect(page.getByText(/in_execution|in execution/i).first()).toBeVisible({
      timeout: 20_000,
    });

    // 11) Event completion
    await page.getByRole('button', { name: 'Complete', exact: true }).click();
    await page.getByRole('button', { name: 'Complete', exact: true }).last().click();
    await expect(page.getByText(/Booking completed|completed/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // 12) Final payment + profitability
    await page.goto(
      `/app/finance/booking/?id=${encodeURIComponent(bookingId)}`,
    );
    await expect(page.getByText(/Profitability|Payments/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Record payment' }).first().click();
    await page.getByLabel('Amount').fill('75000');
    await page.getByLabel('Missing proof reason').fill('E2E final balance');
    await page.getByRole('button', { name: 'Save payment' }).click();
    await expect(page.getByText(/Profitability/i).first()).toBeVisible();

    const booking = await assertEntityExists(`/api/v1/bookings/${bookingId}`);
    expect(booking.status).toBe('completed');
  });
});

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
