/**
 * M5-01 (ADR-019 phase 1) — one-off CLI that links the current Enquiries team's
 * Firebase accounts to EventOS users. TEMPORARY with the Firebase login bridge.
 *
 * Input CSV header:  uid,email,eventosRole,name
 *   - uid          Firebase Auth uid (Firebase console → Authentication → Users)
 *   - email        EventOS user email (created if missing, with NO password)
 *   - eventosRole  one of: owner, admin, sales_manager, sales, operations_manager,
 *                  coordinator, finance, marketing, viewer
 *                  (Enquiries `admin` → owner/admin; `staff` → sales/coordinator —
 *                  the owner decides per person; nothing is mapped automatically)
 *   - name         display name
 *
 * Usage (dry-run is the default and writes nothing):
 *   pnpm exec tsx scripts/link-firebase-users.ts --file team.csv
 *   pnpm exec tsx scripts/link-firebase-users.ts --file team.csv --apply
 *
 * Options:
 *   --tenant-id <uuid>     default: $ENQUIRIES_FEED_TENANT_ID, else the only tenant in the DB
 *   --linked-by <email>    EventOS user recorded as the linker; default: the first owner
 *
 * Existing users keep their role (a mismatch is reported as a warning). Existing
 * identity links are never moved: a uid already linked to another user is a conflict.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  buildLinkPlan,
  parseLinkCsv,
  type PlannedAction,
} from '../src/modules/auth/application/link-firebase-users.plan';

type Args = {
  file: string;
  apply: boolean;
  tenantId?: string;
  linkedBy?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { file: '', apply: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--apply') args.apply = true;
    else if (arg === '--file') args.file = argv[++i] ?? '';
    else if (arg === '--tenant-id') args.tenantId = argv[++i];
    else if (arg === '--linked-by') args.linkedBy = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.file) {
    throw new Error('Usage: link-firebase-users.ts --file <csv> [--apply]');
  }
  return args;
}

function describeAction(action: PlannedAction): string {
  const { row } = action;
  switch (action.kind) {
    case 'create_user_and_link':
      return `CREATE user + LINK   line ${row.line}  ${row.email} (${row.role}) ← ${row.uid}`;
    case 'link_existing_user':
      return `LINK existing user   line ${row.line}  ${row.email} ← ${row.uid}`;
    case 'already_linked':
      return `SKIP already linked  line ${row.line}  ${row.email} ← ${row.uid}`;
    case 'conflict':
      return `CONFLICT             line ${row.line}  ${row.email} ← ${row.uid}: ${action.reason}`;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const parsed = parseLinkCsv(readFileSync(args.file, 'utf8'));

  if (parsed.errors.length > 0) {
    console.error('CSV validation errors:');
    for (const error of parsed.errors) {
      console.error(`  line ${error.line}: ${error.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const tenantId = await resolveTenantId(prisma, args.tenantId);
    const [users, identities] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, role: true },
      }),
      prisma.externalIdentity.findMany({
        where: { tenantId, provider: 'firebase' },
        select: { subject: true, userId: true },
      }),
    ]);

    const plan = buildLinkPlan(parsed.rows, users, identities);

    console.log(
      `${args.apply ? 'APPLY' : 'DRY-RUN'} — tenant ${tenantId}, ${parsed.rows.length} CSV row(s)`,
    );
    for (const action of plan.actions)
      console.log(`  ${describeAction(action)}`);
    for (const warning of plan.warnings) console.warn(`  WARNING: ${warning}`);
    console.log(
      `Summary: ${plan.summary.createUsers} user(s) to create, ${plan.summary.createLinks} link(s) to create, ` +
        `${plan.summary.alreadyLinked} already linked, ${plan.summary.conflicts} conflict(s).`,
    );

    if (plan.summary.conflicts > 0) {
      console.error('Resolve conflicts before applying. Nothing was written.');
      process.exitCode = 1;
      return;
    }
    if (!args.apply) {
      console.log('Dry-run only. Re-run with --apply to write these changes.');
      return;
    }

    const linkedBy = await resolveLinker(prisma, tenantId, args.linkedBy);

    await prisma.$transaction(async (tx) => {
      for (const action of plan.actions) {
        if (action.kind === 'already_linked' || action.kind === 'conflict') {
          continue;
        }

        const userId =
          action.kind === 'link_existing_user'
            ? action.userId
            : (
                await tx.user.create({
                  data: {
                    tenantId,
                    email: action.row.email,
                    name: action.row.name,
                    role: action.row.role,
                    passwordHash: null,
                  },
                })
              ).id;

        await tx.externalIdentity.create({
          data: {
            tenantId,
            userId,
            provider: 'firebase',
            subject: action.row.uid,
            email: action.row.email,
            linkedByUserId: linkedBy,
          },
        });
      }
    });

    console.log('Applied.');
  } finally {
    await prisma.$disconnect();
  }
}

async function resolveTenantId(
  prisma: PrismaClient,
  explicit?: string,
): Promise<string> {
  const configured = explicit ?? process.env.ENQUIRIES_FEED_TENANT_ID;
  if (configured) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: configured },
    });
    if (!tenant) throw new Error(`Tenant ${configured} not found.`);
    return tenant.id;
  }
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  if (tenants.length !== 1) {
    throw new Error(
      `Expected exactly one tenant, found ${tenants.length}. Pass --tenant-id.`,
    );
  }
  return tenants[0].id;
}

async function resolveLinker(
  prisma: PrismaClient,
  tenantId: string,
  email?: string,
): Promise<string> {
  const user = email
    ? await prisma.user.findFirst({
        where: { tenantId, email: email.toLowerCase() },
      })
    : await prisma.user.findFirst({
        where: { tenantId, role: 'owner', disabledAt: null },
        orderBy: { createdAt: 'asc' },
      });
  if (!user) {
    throw new Error(
      email
        ? `--linked-by user ${email} not found.`
        : 'No owner user found to record as linker; pass --linked-by <email>.',
    );
  }
  return user.id;
}

main().catch((error: unknown) => {
  console.error('link-firebase-users failed:', error);
  process.exit(1);
});
