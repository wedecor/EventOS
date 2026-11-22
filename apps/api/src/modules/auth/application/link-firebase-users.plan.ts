import { PHASE1_ROLES, type Role } from '../domain/rbac';

/**
 * M5-01 — pure planning logic for `scripts/link-firebase-users.ts`: parse the CSV
 * (`uid,email,eventosRole,name`), validate it, and compute what an `--apply` run
 * would do against the current state. No I/O, so it is fully unit-testable.
 * TEMPORARY with the Firebase bridge (ADR-019 phase 3).
 */

export const REQUIRED_COLUMNS = [
  'uid',
  'email',
  'eventosrole',
  'name',
] as const;

export type LinkCsvRow = {
  line: number;
  uid: string;
  email: string;
  role: Role;
  name: string;
};

export type LinkCsvError = { line: number; message: string };

export type ParsedLinkCsv = { rows: LinkCsvRow[]; errors: LinkCsvError[] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimal RFC-4180 style splitter (double-quote escaping, commas inside quotes). */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseLinkCsv(text: string): ParsedLinkCsv {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim().length > 0);

  const errors: LinkCsvError[] = [];
  if (lines.length === 0) {
    return { rows: [], errors: [{ line: 1, message: 'CSV is empty.' }] };
  }

  const header = splitCsvLine(lines[0].raw).map((cell) => cell.toLowerCase());
  const indexOf = new Map(header.map((name, index) => [name, index]));
  const missing = REQUIRED_COLUMNS.filter((name) => !indexOf.has(name));
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          line: lines[0].line,
          message: `Missing required column(s): ${missing.join(', ')}. Expected header: uid,email,eventosRole,name`,
        },
      ],
    };
  }

  const rows: LinkCsvRow[] = [];
  const seenUids = new Map<string, number>();
  const seenEmails = new Map<string, number>();

  for (const { raw, line } of lines.slice(1)) {
    const cells = splitCsvLine(raw);
    const cell = (name: (typeof REQUIRED_COLUMNS)[number]) =>
      cells[indexOf.get(name) as number] ?? '';

    const uid = cell('uid');
    const email = cell('email').toLowerCase();
    const role = cell('eventosrole');
    const name = cell('name');

    const rowErrors: string[] = [];
    if (!uid) rowErrors.push('uid is required');
    if (!EMAIL_PATTERN.test(email)) rowErrors.push('email is invalid');
    if (!(PHASE1_ROLES as readonly string[]).includes(role)) {
      rowErrors.push(
        `eventosRole "${role}" is not one of: ${PHASE1_ROLES.join(', ')}`,
      );
    }
    if (!name) rowErrors.push('name is required');
    if (uid && seenUids.has(uid)) {
      rowErrors.push(`duplicate uid (first seen on line ${seenUids.get(uid)})`);
    }
    if (email && seenEmails.has(email)) {
      rowErrors.push(
        `duplicate email (first seen on line ${seenEmails.get(email)})`,
      );
    }

    if (rowErrors.length > 0) {
      errors.push({ line, message: rowErrors.join('; ') });
      continue;
    }

    seenUids.set(uid, line);
    seenEmails.set(email, line);
    rows.push({ line, uid, email, role: role as Role, name });
  }

  return { rows, errors };
}

export type ExistingUser = { id: string; email: string; role: string };
export type ExistingIdentity = { subject: string; userId: string };

export type PlannedAction =
  | { kind: 'create_user_and_link'; row: LinkCsvRow }
  | { kind: 'link_existing_user'; row: LinkCsvRow; userId: string }
  | { kind: 'already_linked'; row: LinkCsvRow; userId: string }
  | { kind: 'conflict'; row: LinkCsvRow; reason: string };

export type LinkPlan = {
  actions: PlannedAction[];
  warnings: string[];
  summary: {
    createUsers: number;
    createLinks: number;
    alreadyLinked: number;
    conflicts: number;
  };
};

export function buildLinkPlan(
  rows: readonly LinkCsvRow[],
  users: readonly ExistingUser[],
  identities: readonly ExistingIdentity[],
): LinkPlan {
  const userByEmail = new Map(
    users.map((user) => [user.email.toLowerCase(), user]),
  );
  const identityBySubject = new Map(
    identities.map((identity) => [identity.subject, identity]),
  );

  const actions: PlannedAction[] = [];
  const warnings: string[] = [];

  for (const row of rows) {
    const user = userByEmail.get(row.email);
    const identity = identityBySubject.get(row.uid);

    if (identity) {
      if (user && identity.userId === user.id) {
        actions.push({ kind: 'already_linked', row, userId: user.id });
      } else {
        actions.push({
          kind: 'conflict',
          row,
          reason: `uid is already linked to a different user (${identity.userId})`,
        });
      }
      continue;
    }

    if (user) {
      if (user.role !== row.role) {
        warnings.push(
          `line ${row.line}: ${row.email} already exists with role "${user.role}" (CSV says "${row.role}"); the existing role is kept.`,
        );
      }
      actions.push({ kind: 'link_existing_user', row, userId: user.id });
    } else {
      actions.push({ kind: 'create_user_and_link', row });
    }
  }

  return {
    actions,
    warnings,
    summary: {
      createUsers: actions.filter((a) => a.kind === 'create_user_and_link')
        .length,
      createLinks: actions.filter(
        (a) =>
          a.kind === 'create_user_and_link' || a.kind === 'link_existing_user',
      ).length,
      alreadyLinked: actions.filter((a) => a.kind === 'already_linked').length,
      conflicts: actions.filter((a) => a.kind === 'conflict').length,
    },
  };
}
