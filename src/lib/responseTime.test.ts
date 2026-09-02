/**
 * US-111: the public profile hard-coded responseTime: '< 1 hour' for every
 * agent, and the sticky action bar repeated "Responds in < 1 hour" as literal
 * text. Neither came from data. On a licensed professional's public page,
 * shown to someone deciding whom to contact, that is an advertising claim the
 * platform invented on their behalf.
 *
 * The rule that matters most here is the last one: no data means no badge.
 */
import { describe, it, expect } from 'vitest';
import { formatResponseTime } from './responseTime';

describe('formatResponseTime', () => {
  it('renders nothing when there is no measurement', () => {
    // public_agent_response_hours returns null below 5 responded leads in 90
    // days — a median over one or two responses is not a track record.
    expect(formatResponseTime(null)).toBeUndefined();
    expect(formatResponseTime(undefined)).toBeUndefined();
  });

  it('renders nothing for a nonsensical value rather than guessing', () => {
    expect(formatResponseTime(Number.NaN)).toBeUndefined();
    expect(formatResponseTime(-3)).toBeUndefined();
  });

  it('reports minutes for a fast responder', () => {
    expect(formatResponseTime(0.5)).toBe('~30 min');
  });

  it('never claims zero minutes', () => {
    expect(formatResponseTime(0.001)).toBe('~1 min');
  });

  it('reports hours, singular and plural', () => {
    expect(formatResponseTime(1)).toBe('~1 hour');
    expect(formatResponseTime(4.2)).toBe('~4 hours');
  });

  it('reports days once a response takes longer than one', () => {
    expect(formatResponseTime(48)).toBe('~2 days');
    expect(formatResponseTime(25)).toBe('~1 day');
  });

  it('does not round a slow response down into an hour', () => {
    // The old copy claimed "< 1 hour" regardless; an agent who typically takes
    // three days must read as three days.
    expect(formatResponseTime(72)).toBe('~3 days');
  });
});
