/**
 * M5-01 — production seed (run as the Cloud Run Job `eventos-seed-prod`).
 *
 * Creates the single tenant and ONE owner user. No demo data, no sample leads,
 * quotations, bookings or inventory. Idempotent: re-running updates names only and
 * never overwrites an existing password unless SEED_OWNER_PASSWORD is provided.
 *
 *   SEED_OWNER_EMAIL=owner@example.com SEED_OWNER_NAME="Owner Name" \
 *     node_modules/.bin/tsx prisma/seed-prod.ts
 *
 * The owner signs in through the Firebase bridge (link their Firebase uid with
 * `scripts/link-firebase-users.ts`); a password is optional.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { resolveProdSeedConfig } from '../src/shared/seed/prod-seed.config';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main(): Promise<void> {
  const config = resolveProdSeedConfig(process.env);

  const tenant = await prisma.tenant.upsert({
    where: { id: config.tenantId },
    create: {
      id: config.tenantId,
      name: config.tenantName,
      slug: config.tenantSlug,
    },
    update: { name: config.tenantName, slug: config.tenantSlug },
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, businessName: config.tenantName },
    update: { businessName: config.tenantName },
  });

  const passwordHash = config.ownerPassword
    ? await bcrypt.hash(config.ownerPassword, 12)
    : undefined;

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: config.ownerEmail },
    },
    create: {
      tenantId: tenant.id,
      email: config.ownerEmail,
      name: config.ownerName,
      role: 'owner',
      passwordHash,
    },
    update: {
      name: config.ownerName,
      role: 'owner',
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  console.log(`Seeded tenant "${tenant.name}" (${tenant.slug}, ${tenant.id})`);
  console.log(`Seeded owner ${config.ownerEmail} (no demo data)`);
}

main()
  .catch((error: unknown) => {
    console.error('Production seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
