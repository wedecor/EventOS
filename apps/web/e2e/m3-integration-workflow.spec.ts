import { expect, test } from '@playwright/test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apiJson, assertEntityExists } from './helpers/api';
import { loginAsAdmin } from './helpers/auth';
import {
  assertCommunicationForInvoice,
  assertCommunicationForQuotation,
  assertIntegrationSecretsMaskedInDb,
  assertStoredDocumentForBooking,
} from './helpers/db';
import { e2eCredentials } from './helpers/env';
import { ensureM3Fixtures, type M3Fixtures } from './helpers/m3-setup';

/**
 * M3 integration foundation workflow (UI → API → DB).
 * Uses isolated eventos_e2e stack + test mail/storage adapters.
 * Does not claim live SMTP/S3 delivery.
 */
test.describe('M3 integration foundation workflow', () => {
  test.beforeEach(({}, testInfo) => {
    if (!e2eCredentials()) {
      testInfo.skip(
        true,
        'Set E2E_ADMIN_PASSWORD or SEED_ADMIN_PASSWORD (and run seeded API + web).',
      );
    }
  });

  test('PDF → email → documents → invoice → integrations', async ({
    page,
  }) => {
    const fixtures: M3Fixtures = await ensureM3Fixtures();
    await loginAsAdmin(page);

    // 1) Open existing quotation
    await page.goto(
      `/app/quotations/view/?id=${encodeURIComponent(fixtures.quotationId)}`,
    );
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible({
      timeout: 30_000,
    });
    await assertEntityExists(`/api/v1/quotations/${fixtures.quotationId}`);

    // 2) Generate and download PDF
    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).click();
    const quotationPdf = await pdfDownload;
    expect(quotationPdf.suggestedFilename()).toMatch(/\.pdf$/i);
    await expect(page.getByText(/Quotation PDF downloaded/i)).toBeVisible({
      timeout: 20_000,
    });

    // 3) Send quotation email (test adapter)
    await page.getByRole('button', { name: 'Email PDF' }).click();
    await expect(
      page.getByText(/Quotation emailed to .*provider accepted/i),
    ).toBeVisible({ timeout: 30_000 });

    // 4) Verify communication record (API + DB)
    const quotationComms = await apiJson<{
      data: Array<{ id: string; quotationId: string | null; status: string }>;
    }>(`/api/v1/quotations/${fixtures.quotationId}/communications`);
    expect(quotationComms.data.length).toBeGreaterThan(0);
    expect(quotationComms.data[0]?.status).toMatch(/sent|failed/);
    const dbQuotationComm = assertCommunicationForQuotation(
      fixtures.quotationId,
    );
    expect(dbQuotationComm.provider).toBe('test');
    expect(dbQuotationComm.status).toBe('sent');

    // 5) Open booking finance
    await page.goto(
      `/app/finance/booking/?id=${encodeURIComponent(fixtures.bookingId)}`,
    );
    await expect(page.getByText('Event documents')).toBeVisible({
      timeout: 30_000,
    });

    // 6) Upload an event document
    const stamp = Date.now();
    const uploadName = `m3-contract-${stamp}.pdf`;
    const uploadPath = join(mkdtempSync(join(tmpdir(), 'eventos-m3-')), uploadName);
    writeFileSync(
      uploadPath,
      Buffer.from(
        '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n',
        'utf8',
      ),
    );
    await page.getByLabel(/Category/i).selectOption('contract');
    await page.locator('input[type="file"]').first().setInputFiles(uploadPath);
    await expect(page.getByText('Document uploaded')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(uploadName)).toBeVisible({ timeout: 15_000 });

    // 7) List + download document + DB verify
    const stored = assertStoredDocumentForBooking(
      fixtures.bookingId,
      `m3-contract-${stamp}`,
    );
    expect(stored.fileName).toContain('m3-contract');
    const docDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).first().click();
    const docFile = await docDownload;
    expect(docFile.suggestedFilename().length).toBeGreaterThan(0);

    // 8) Generate invoice + download PDF
    await page.getByRole('button', { name: 'Create invoice' }).click();
    await page.getByLabel('Customer ID').fill(fixtures.customerId);
    await page.getByLabel('Line description').fill(`M3 invoice line ${stamp}`);
    await page.getByLabel('Quantity').fill('1');
    await page.getByLabel('Unit price').fill('5000');
    await page.getByRole('button', { name: 'Create draft' }).click();
    await expect(page.getByText(/Invoice created \(draft\)/i)).toBeVisible({
      timeout: 20_000,
    });

    const invoices = await apiJson<{
      data: Array<{ id: string; bookingId: string; invoiceNumber: number }>;
    }>(`/api/v1/bookings/${fixtures.bookingId}/invoices`);
    const invoice = invoices.data[0];
    expect(invoice?.id).toBeTruthy();
    const invoiceId = invoice!.id;

    const invoicePdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).first().click();
    const invoicePdf = await invoicePdfDownload;
    expect(invoicePdf.suggestedFilename()).toMatch(/\.pdf$/i);

    // 9) Send invoice email (test adapter)
    await page.getByRole('button', { name: 'Email' }).first().click();
    await expect(
      page.getByText(/Invoice emailed to .*provider accepted/i),
    ).toBeVisible({ timeout: 30_000 });

    // 10) Verify communication history (API + DB)
    const invoiceComms = await apiJson<{
      data: Array<{ id: string; invoiceId: string | null; status: string }>;
    }>(`/api/v1/invoices/${invoiceId}/communications`);
    expect(invoiceComms.data.length).toBeGreaterThan(0);
    const dbInvoiceComm = assertCommunicationForInvoice(invoiceId);
    expect(dbInvoiceComm.provider).toBe('test');
    expect(dbInvoiceComm.status).toBe('sent');

    // 11) Open Integrations settings
    await page.goto('/app/settings/integrations/');
    await expect(
      page.getByRole('heading', { name: 'Email provider' }),
    ).toBeVisible({ timeout: 20_000 });

    // 12) Update configuration + verify secret masking
    await page.getByLabel('From name', { exact: true }).fill('EventOS M3 Test');
    await page.getByLabel('From email', { exact: true }).fill('m3-from@example.test');
    await page.getByLabel('SMTP user', { exact: true }).fill('m3-smtp-user');
    await page
      .getByLabel('SMTP password', { exact: true })
      .fill('M3-Secret-Password-NotReturned');
    await page.getByRole('button', { name: 'Save integration settings' }).click();
    await expect(
      page.getByText(/Integration settings saved/i),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('email-secret-mask')).toContainText(
      /Configured:/i,
    );
    await expect(page.getByLabel('SMTP password', { exact: true })).toHaveValue(
      '',
    );
    assertIntegrationSecretsMaskedInDb(fixtures.tenantId);

    const settingsAfter = await apiJson<{
      data: Record<string, unknown>;
    }>('/api/v1/integrations/settings');
    expect(settingsAfter.data.emailSecretConfigured).toBe(true);
    expect(settingsAfter.data.smtpPassword).toBeUndefined();
    expect(settingsAfter.data.smtpPasswordEncrypted).toBeUndefined();
    expect(String(settingsAfter.data.emailSecretMasked ?? '')).toMatch(/•+/);

    // 13) Supported connection tests (test adapter / local storage)
    await page.getByRole('button', { name: 'Test email connection' }).click();
    await expect(
      page.getByText(/Provider accepted the test message/i),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Test storage connection' }).click();
    await expect(
      page.getByText(/Storage put\/get\/delete probe succeeded/i),
    ).toBeVisible({ timeout: 20_000 });

    const settingsFinal = await apiJson<{
      data: {
        lastEmailTestStatus: string | null;
        lastStorageTestStatus: string | null;
      };
    }>('/api/v1/integrations/settings');
    expect(settingsFinal.data.lastEmailTestStatus).toBe('ok');
    expect(settingsFinal.data.lastStorageTestStatus).toBe('ok');

    expect(invoiceId).toBeTruthy();
    expect(dbQuotationComm.id).toBeTruthy();
    expect(dbInvoiceComm.id).toBeTruthy();
    expect(stored.id).toBeTruthy();
  });
});
