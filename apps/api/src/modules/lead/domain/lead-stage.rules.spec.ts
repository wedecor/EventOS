import {
  isAllowedLeadStageTransition,
  isTerminalLeadStage,
} from './lead-stage.rules';

describe('lead-stage.rules', () => {
  it('allows valid pipeline transitions', () => {
    expect(isAllowedLeadStageTransition('new', 'in_talks')).toBe(true);
    expect(isAllowedLeadStageTransition('in_talks', 'approved')).toBe(true);
    expect(isAllowedLeadStageTransition('approved', 'completed')).toBe(true);
  });

  it('blocks invalid pipeline transitions', () => {
    expect(isAllowedLeadStageTransition('new', 'approved')).toBe(false);
    expect(isAllowedLeadStageTransition('lost', 'in_talks')).toBe(false);
  });

  it('identifies terminal lead stages', () => {
    expect(isTerminalLeadStage('completed')).toBe(true);
    expect(isTerminalLeadStage('in_talks')).toBe(false);
  });
});
