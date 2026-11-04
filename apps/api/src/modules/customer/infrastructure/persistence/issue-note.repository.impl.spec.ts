import { PrismaService } from '../../../../database/prisma.service';
import { IssueNoteRepositoryImpl } from './issue-note.repository.impl';

describe('IssueNoteRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';
  const customerId = 'customer-1';

  const prismaNote = {
    id: 'issue-1',
    tenantId,
    eventId,
    customerId,
    message: 'Complaint',
    severity: 'medium' as const,
    notes: null,
    status: 'open' as const,
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let prisma: { issueNote: { create: jest.Mock } };
  let repository: IssueNoteRepositoryImpl;

  beforeEach(() => {
    prisma = { issueNote: { create: jest.fn() } };
    repository = new IssueNoteRepositoryImpl(
      prisma as unknown as PrismaService,
    );
  });

  it('create persists status open without version', async () => {
    prisma.issueNote.create.mockResolvedValue(prismaNote);

    const result = await repository.create(tenantId, {
      eventId,
      customerId,
      message: 'Complaint',
      severity: 'medium',
    });

    expect(prisma.issueNote.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        eventId,
        customerId,
        message: 'Complaint',
        severity: 'medium',
        notes: null,
        status: 'open',
      },
    });
    expect(result.status).toBe('open');
    expect(result).not.toHaveProperty('version');
  });
});
