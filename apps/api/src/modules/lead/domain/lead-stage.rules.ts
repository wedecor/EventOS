import type { LeadRecord } from '../domain/repositories/lead.repository';

export type LeadStage = LeadRecord['stage'];

const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ['in_talks', 'lost', 'cancelled'],
  in_talks: ['approved', 'lost', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  lost: [],
  cancelled: [],
};

const TERMINAL_STAGES: LeadStage[] = ['completed', 'lost', 'cancelled'];

export function isAllowedLeadStageTransition(
  from: LeadStage,
  to: LeadStage,
): boolean {
  if (from === to) {
    return true;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function isTerminalLeadStage(stage: LeadStage): boolean {
  return TERMINAL_STAGES.includes(stage);
}
