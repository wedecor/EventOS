import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const WE_DECOR_TENANT_SLUG = 'we-decor';
const ADMIN_EMAIL = 'admin@wedecor.events';
/** Dev-only default — change in production after seed. */
const ADMIN_DEFAULT_PASSWORD = 'ChangeMe!EventOS1';

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: WE_DECOR_TENANT_SLUG },
    create: {
      name: 'We Decor Events',
      slug: WE_DECOR_TENANT_SLUG,
    },
    update: {
      name: 'We Decor Events',
    },
  });

  const passwordHash = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);

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
      passwordHash,
    },
  });

  console.log(`Seeded tenant "${tenant.name}" (${tenant.slug})`);
  console.log(`Seeded admin ${ADMIN_EMAIL} (dev password in seed.ts)`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
