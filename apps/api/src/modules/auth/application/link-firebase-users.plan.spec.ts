import {
  buildLinkPlan,
  parseLinkCsv,
  splitCsvLine,
} from './link-firebase-users.plan';

const HEADER = 'uid,email,eventosRole,name';

describe('splitCsvLine', () => {
  it('handles quoted cells with commas and escaped quotes', () => {
    expect(splitCsvLine('a,"b, c","say ""hi"""')).toEqual([
      'a',
      'b, c',
      'say "hi"',
    ]);
  });
});

describe('parseLinkCsv', () => {
  it('parses valid rows, normalising email case', () => {
    const { rows, errors } = parseLinkCsv(
      `${HEADER}\nuid-1,Owner@Example.com,owner,Olivia Owner\nuid-2,sales@example.com,sales,"Sam, Sales"\n`,
    );

    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        line: 2,
        uid: 'uid-1',
        email: 'owner@example.com',
        role: 'owner',
        name: 'Olivia Owner',
      },
      {
        line: 3,
        uid: 'uid-2',
        email: 'sales@example.com',
        role: 'sales',
        name: 'Sam, Sales',
      },
    ]);
  });

  it('accepts a BOM, CRLF and header casing differences', () => {
    const { rows, errors } = parseLinkCsv(
      `\uFEFFUID,Email,EventOSRole,Name\r\nuid-1,a@b.co,admin,A\r\n`,
    );

    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });

  it('reports a missing column', () => {
    const { rows, errors } = parseLinkCsv('uid,email,name\nu,a@b.co,A');

    expect(rows).toEqual([]);
    expect(errors[0].message).toMatch(/eventosrole/);
  });

  it('reports invalid rows with line numbers and keeps valid ones', () => {
    const { rows, errors } = parseLinkCsv(
      `${HEADER}\n,bad-email,superuser,\nuid-2,ok@example.com,sales,Ok`,
    );

    expect(rows.map((r) => r.uid)).toEqual(['uid-2']);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(2);
    expect(errors[0].message).toMatch(/uid is required/);
    expect(errors[0].message).toMatch(/email is invalid/);
    expect(errors[0].message).toMatch(/eventosRole/);
    expect(errors[0].message).toMatch(/name is required/);
  });

  it('flags duplicate uids and emails within the file', () => {
    const { rows, errors } = parseLinkCsv(
      `${HEADER}\nu1,a@b.co,sales,A\nu1,c@d.co,sales,C\nu3,a@b.co,sales,A2`,
    );

    expect(rows).toHaveLength(1);
    expect(errors.map((e) => e.line)).toEqual([3, 4]);
    expect(errors[0].message).toMatch(/duplicate uid/);
    expect(errors[1].message).toMatch(/duplicate email/);
  });

  it('rejects an empty file', () => {
    expect(parseLinkCsv('  \n').errors[0].message).toMatch(/empty/i);
  });
});

describe('buildLinkPlan', () => {
  const rows = parseLinkCsv(
    `${HEADER}\nu-new,new@example.com,sales,New\nu-existing,exist@example.com,coordinator,Existing\nu-done,done@example.com,admin,Done\nu-clash,clash@example.com,sales,Clash`,
  ).rows;

  const users = [
    { id: 'user-exist', email: 'exist@example.com', role: 'sales' },
    { id: 'user-done', email: 'done@example.com', role: 'admin' },
    { id: 'user-clash', email: 'clash@example.com', role: 'sales' },
  ];
  const identities = [
    { subject: 'u-done', userId: 'user-done' },
    { subject: 'u-clash', userId: 'someone-else' },
  ];

  it('classifies each row and counts the summary', () => {
    const plan = buildLinkPlan(rows, users, identities);

    expect(plan.actions.map((a) => a.kind)).toEqual([
      'create_user_and_link',
      'link_existing_user',
      'already_linked',
      'conflict',
    ]);
    expect(plan.summary).toEqual({
      createUsers: 1,
      createLinks: 2,
      alreadyLinked: 1,
      conflicts: 1,
    });
  });

  it('warns when an existing user has a different role and keeps the existing role', () => {
    const plan = buildLinkPlan(rows, users, identities);

    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toMatch(/exist@example.com/);
    expect(plan.warnings[0]).toMatch(/existing role is kept/);
  });
});
