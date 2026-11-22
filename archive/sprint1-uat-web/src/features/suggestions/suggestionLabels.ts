export function suggestionTypeLabel(type: string): string {
  switch (type) {
    case 'workspace.create':
      return 'Create event workspace';
    case 'checklist.generate':
      return 'Generate preparation checklist';
    case 'staff.assign':
      return 'Assign staff to booking';
    default:
      return type;
  }
}

export function bookingPathForSuggestion(
  aggregateType: string,
  aggregateId: string,
): string | null {
  if (aggregateType === 'Event') {
    return `/bookings/${aggregateId}`;
  }
  return null;
}
