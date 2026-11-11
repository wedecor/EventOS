/**
 * Deterministic E2E fixtures for isolated `eventos_e2e` database.
 * Synthetic data only — never run against production.
 *
 * Usage:
 *   set -a; source .env.e2e; set +a
 *   pnpm exec tsx prisma/seed-e2e.ts
 */
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PHASE1_TENANT_ID } from '../src/shared/tenant/phase1-tenant';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'admin@wedecor.events';
const adminPasswordEnv = process.env.SEED_ADMIN_PASSWORD;
if (!adminPasswordEnv) {
  throw new Error(
    'SEED_ADMIN_PASSWORD is required for E2E seed (set via apps/api/.env.e2e; never commit).',
  );
}
const ADMIN_PASSWORD: string = adminPasswordEnv;

/** Fixed UUIDs for repeatable assertions. */
export const E2E_IDS = {
  tenantId: PHASE1_TENANT_ID,
  adminUserId: '11111111-1111-4111-8111-111111111111',
  staffMemberId: '22222222-2222-4222-8222-222222222222',
  vendorId: '33333333-3333-4333-8333-333333333333',
  /** Baseline reference customer (workflow still creates its own via UI). */
  customerId: '44444444-4444-4444-8444-444444444444',
} as const;

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.includes('eventos_e2e')) {
    throw new Error(
      'Refusing to seed: DATABASE_URL must target eventos_e2e (isolated E2E DB).',
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const tenant = await prisma.tenant.upsert({
    where: { id: E2E_IDS.tenantId },
    create: {
      id: E2E_IDS.tenantId,
      name: 'We Decor Events',
      slug: 'we-decor',
    },
    update: { name: 'We Decor Events', slug: 'we-decor' },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, businessName: 'We Decor Events' },
    update: { businessName: 'We Decor Events' },
  });

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: ADMIN_EMAIL },
    },
    create: {
      id: E2E_IDS.adminUserId,
      tenantId: tenant.id,
      email: ADMIN_EMAIL,
      name: 'E2E Admin',
      role: 'admin',
      passwordHash,
    },
    update: {
      name: 'E2E Admin',
      role: 'admin',
      passwordHash,
    },
  });

  await prisma.staffMember.upsert({
    where: { id: E2E_IDS.staffMemberId },
    create: {
      id: E2E_IDS.staffMemberId,
      tenantId: tenant.id,
      userId: admin.id,
      name: 'E2E Coordinator',
      role: 'coordinator',
      department: 'Operations',
      phone: '+919999000001',
      email: 'e2e.coordinator@wedecor.events',
      employmentType: 'permanent',
      status: 'active',
    },
    update: {
      name: 'E2E Coordinator',
      role: 'coordinator',
      status: 'active',
      userId: admin.id,
    },
  });

  await prisma.vendor.upsert({
    where: { id: E2E_IDS.vendorId },
    create: {
      id: E2E_IDS.vendorId,
      tenantId: tenant.id,
      name: 'E2E Floral Supplies',
      category: 'flowers',
      status: 'active',
      contactName: 'Vendor Contact',
      contactPhone: '+919999000002',
      location: 'Bengaluru',
      servicesProvided: 'Floral décor',
      notes: 'Synthetic E2E vendor',
    },
    update: {
      name: 'E2E Floral Supplies',
      category: 'flowers',
      status: 'active',
    },
  });

  await prisma.customer.upsert({
    where: { id: E2E_IDS.customerId },
    create: {
      id: E2E_IDS.customerId,
      tenantId: tenant.id,
      displayName: 'E2E Reference Customer',
      primaryPhone: '+919999000099',
      primaryEmail: 'e2e.customer@example.test',
      status: 'active',
    },
    update: {
      displayName: 'E2E Reference Customer',
      status: 'active',
    },
  });

  const fixturePath = join(__dirname, '../../web/e2e/fixtures.generated.json');
  writeFileSync(
    fixturePath,
    JSON.stringify(
      {
        tenantId: tenant.id,
        adminUserId: admin.id,
        adminEmail: ADMIN_EMAIL,
        staffMemberId: E2E_IDS.staffMemberId,
        vendorId: E2E_IDS.vendorId,
        referenceCustomerId: E2E_IDS.customerId,
        seededAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  console.log('E2E seed complete');
  console.log(`  tenant=${tenant.id}`);
  console.log(`  admin=${admin.email} (${admin.id})`);
  console.log(`  staff=${E2E_IDS.staffMemberId}`);
  console.log(`  vendor=${E2E_IDS.vendorId}`);
  console.log(`  fixtures → ${fixturePath}`);
}

main()
  .catch((error: unknown) => {
    console.error('E2E seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
