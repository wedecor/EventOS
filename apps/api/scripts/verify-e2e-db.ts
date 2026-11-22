/**
 * Post-E2E database verification against isolated eventos_e2e.
 * Usage: set -a; source .env.e2e; set +a; pnpm exec tsx scripts/verify-e2e-db.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PHASE1_TENANT_ID } from '../src/shared/tenant/phase1-tenant';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  assert(
    process.env.DATABASE_URL?.includes('eventos_e2e'),
    'DATABASE_URL must target eventos_e2e',
  );

  const tenantId = PHASE1_TENANT_ID;
  const booking = await prisma.event.findFirst({
    where: { tenantId, status: 'completed' },
    orderBy: { completedAt: 'desc' },
  });
  assert(booking, 'No completed booking found');
  assert(booking.tenantId === tenantId, 'Booking tenant mismatch');
  assert(booking.quotationId, 'Booking missing quotationId');
  assert(booking.executionOwnerId, 'Booking missing execution owner');
  assert(booking.status === 'completed', 'Booking not completed');

  const quotation = await prisma.quotation.findFirst({
    where: { id: booking.quotationId, tenantId },
  });
  assert(quotation, 'Quotation not found for booking');
  assert(quotation.status === 'approved', `Quotation status=${quotation.status}`);

  const lines = await prisma.quotationLineItem.findMany({
    where: { quotationId: quotation.id, tenantId },
  });
  assert(lines.length >= 1, 'Expected ≥1 quotation line item');
  const lineTotal = lines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unitPriceAmount),
    0,
  );
  assert(
    Math.abs(Number(quotation.totalAmount) - lineTotal) < 0.01,
    `Quotation total ${quotation.totalAmount} != line sum ${lineTotal}`,
  );

  const payments = await prisma.payment.findMany({
    where: {
      tenantId,
      status: 'confirmed',
      OR: [
        { quotationId: quotation.id },
        { bookingId: booking.id },
        { leadId: booking.leadId ?? undefined },
      ],
    },
  });
  assert(payments.length >= 2, `Expected ≥2 confirmed payments, got ${payments.length}`);
  const paymentIds = new Set(payments.map((p) => p.id));
  assert(paymentIds.size === payments.length, 'Duplicate payment ids detected');

  const advance = payments.filter(
    (p) => p.quotationId === quotation.id || p.leadId === booking.leadId,
  );
  assert(advance.length >= 1, 'Missing advance payment against lead/quotation');

  const finalPayments = payments.filter((p) => p.bookingId === booking.id);
  assert(finalPayments.length >= 1, 'Missing booking-scoped final payment');

  const staffAssignments = await prisma.staffAssignment.findMany({
    where: { tenantId, bookingId: booking.id },
  });
  assert(staffAssignments.length >= 1, 'Missing staff assignment');

  const procurements = await prisma.vendorProcurement.findMany({
    where: { tenantId, bookingId: booking.id },
  });
  assert(procurements.length >= 1, 'Missing vendor procurement');

  const expenses = await prisma.vendorExpense.findMany({
    where: { tenantId, bookingId: booking.id, status: 'confirmed' },
  });
  assert(expenses.length >= 1, 'Missing vendor expense');

  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const paymentTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const draftInvoices = await prisma.invoice.count({
    where: { tenantId, bookingId: booking.id, status: 'draft' },
  });
  assert(draftInvoices === 0, 'Draft invoices should not remain after complete');

  const foreignTenantLeak = await prisma.event.count({
    where: { id: booking.id, NOT: { tenantId } },
  });
  assert(foreignTenantLeak === 0, 'Tenant ownership leak');

  console.log(
    JSON.stringify(
      {
        ok: true,
        bookingId: booking.id,
        quotationId: quotation.id,
        quotationTotal: Number(quotation.totalAmount),
        lineCount: lines.length,
        lineTotal,
        paymentCount: payments.length,
        paymentTotal,
        expenseCount: expenses.length,
        expenseTotal,
        staffAssignments: staffAssignments.length,
        procurements: procurements.length,
        profitabilityApprox: paymentTotal - expenseTotal,
        statusPath: booking.status,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error('DB verification failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
