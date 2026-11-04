import { success } from '../../../shared/application/result';
import { IssueApplicationService } from '../application/services/issue.application.service';
import { IssueController } from './issue.controller';

describe('IssueController', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';

  let issueService: { createIssueNote: jest.Mock };
  let controller: IssueController;

  beforeEach(() => {
    issueService = { createIssueNote: jest.fn() };
    controller = new IssueController(
      issueService as unknown as IssueApplicationService,
    );
  });

  it('delegates create to IssueApplicationService and wraps Result', async () => {
    issueService.createIssueNote.mockResolvedValue(
      success({ id: 'issue-1', eventId, status: 'open' }),
    );

    const response = await controller.createIssueNote(tenantId, eventId, {
      message: 'Complaint',
      severity: 'high',
      notes: null,
    });

    expect(issueService.createIssueNote).toHaveBeenCalledWith(
      tenantId,
      eventId,
      {
        message: 'Complaint',
        severity: 'high',
        notes: null,
      },
    );
    expect(response).toEqual({
      data: { id: 'issue-1', eventId, status: 'open' },
    });
  });
});
