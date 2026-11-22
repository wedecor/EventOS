import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PHASE1_TENANT_ID } from '../src/shared/tenant/phase1-tenant';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const WE_DECOR_TENANT_SLUG = 'we-decor';
const ADMIN_EMAIL = 'admin@wedecor.events';
// The admin password is provided out-of-band per environment (never hardcoded).
// When set, the seed hashes it (bcrypt cost 12, docs/14) so the admin can log in;
// otherwise the account is left without a usable password.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function main(): Promise<void> {
  // ADR-016: the seeded We Decor tenant MUST use the fixed PHASE1_TENANT_ID so the
  // row matches the id resolved by the `@TenantId()` decorator. Upsert by id (not
  // slug) to guarantee that match on a fresh database.
  const tenant = await prisma.tenant.upsert({
    where: { id: PHASE1_TENANT_ID },
    create: {
      id: PHASE1_TENANT_ID,
      name: 'We Decor Events',
      slug: WE_DECOR_TENANT_SLUG,
    },
    update: {
      name: 'We Decor Events',
      slug: WE_DECOR_TENANT_SLUG,
    },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      businessName: 'We Decor Events',
    },
    update: {
      businessName: 'We Decor Events',
    },
  });

  const passwordHash = ADMIN_PASSWORD
    ? await bcrypt.hash(ADMIN_PASSWORD, 12)
    : undefined;

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: ADMIN_EMAIL,
      },
    },
    create: {
      tenantId: tenant.id,
      email: ADMIN_EMAIL,
      name: 'We Decor Admin',
      role: 'admin',
      passwordHash,
    },
    update: {
      name: 'We Decor Admin',
      role: 'admin',
      // Only overwrite the password when a new one is explicitly provided.
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  console.log(`Seeded tenant "${tenant.name}" (${tenant.slug})`);
  console.log(`Seeded tenant settings for ${tenant.slug}`);
  console.log(`Seeded admin user ${ADMIN_EMAIL}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
