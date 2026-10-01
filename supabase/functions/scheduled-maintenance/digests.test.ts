import { describe, it, expect } from 'vitest';
import { digestKindFor } from './digests.ts';

describe('digestKindFor (US-230)', () => {
  const monday = new Date('2026-10-05T13:00:00Z');
  const tuesday = new Date('2026-10-06T13:00:00Z');
  it('daily by default, and the weekly edition on Mondays', () => {
    expect(digestKindFor(undefined, tuesday)).toBe('daily');
    expect(digestKindFor(undefined, monday)).toBe('weekly');
  });
  it('weekly subscribers hear only on Mondays', () => {
    expect(digestKindFor('weekly', tuesday)).toBeNull();
    expect(digestKindFor('weekly', monday)).toBe('weekly');
  });
  it('off is off', () => {
    expect(digestKindFor('off', monday)).toBeNull();
  });
});
