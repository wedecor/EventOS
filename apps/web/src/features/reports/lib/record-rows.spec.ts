import { describe, expect, it } from 'vitest';
import { recordToCountRows } from './record-rows';

describe('recordToCountRows', () => {
  it('maps and sorts record entries for display', () => {
    expect(recordToCountRows({ packed: 2, planned: 1 })).toEqual([
      { key: 'packed', label: 'Packed', count: 2 },
      { key: 'planned', label: 'Planned', count: 1 },
    ]);
  });

  it('returns empty for undefined', () => {
    expect(recordToCountRows(undefined)).toEqual([]);
  });
});
