import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const WE_DECOR_TENANT_SLUG = 'we-decor';
const ADMIN_EMAIL = 'admin@wedecor.events';

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
    },
    update: {
      name: 'We Decor Admin',
      role: 'admin',
    },
  });

  console.log(`Seeded tenant "${tenant.name}" (${tenant.slug})`);
  console.log(`Seeded admin placeholder ${ADMIN_EMAIL}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
