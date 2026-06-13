import { describe, expect, it } from 'vitest';
import { getOperationalUtcRange } from './date';

describe('operational UTC range', () => {
  it('mengubah satu hari WITA menjadi rentang UTC yang benar', () => {
    const range = getOperationalUtcRange('2026-06-13');

    expect(range.start.toISOString()).toBe('2026-06-12T16:00:00.000Z');
    expect(range.end.toISOString()).toBe('2026-06-13T16:00:00.000Z');
  });
});
