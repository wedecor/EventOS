import { describe, expect, it } from 'vitest';
import { parseWorkspaceView } from './workspace.schemas';

describe('workspace schemas', () => {
  it('parses workspace envelope', () => {
    const view = parseWorkspaceView({
      data: {
        eventId: 'b1',
        workspaceStatus: 'inactive',
        preparationStatus: 'pending',
        operationalMilestone: null,
        executionOwnerId: null,
      },
    });
    expect(view.workspaceStatus).toBe('inactive');
    expect(view.eventId).toBe('b1');
  });

  it('rejects unknown workspace status', () => {
    expect(() =>
      parseWorkspaceView({
        data: {
          eventId: 'b1',
          workspaceStatus: 'pending',
          preparationStatus: 'pending',
          operationalMilestone: null,
          executionOwnerId: null,
        },
      }),
    ).toThrow();
  });
});
