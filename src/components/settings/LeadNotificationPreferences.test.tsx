/**
 * US-518 (US-445): the agent chooses the morning email's hour, on their own
 * clock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { digestHourOf } from '@/hooks/useNotificationPreferences';

const mutate = vi.fn();
let prefs: { digestMode: 'daily' | 'weekly' | 'off'; digestHour: number };
let zone: { timeZone: string | null; detected: string | null };

vi.mock('@/hooks/useNotificationPreferences', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useNotificationPreferences')>()),
  useNotificationPreferences: () => ({
    leadMode: 'instant',
    slaHours: 2,
    ...prefs,
    isLoading: false,
    update: { mutate, isPending: false },
  }),
}));
vi.mock('@/hooks/useAgentTimeZone', () => ({
  useAgentTimeZone: () => ({ ...zone, isLoading: false, isKnown: true }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { LeadNotificationPreferences } from './LeadNotificationPreferences';

const hourControl = () => screen.queryByRole('combobox', { name: 'Send it at' });

describe('LeadNotificationPreferences morning email hour (US-518)', () => {
  beforeEach(() => {
    mutate.mockClear();
    prefs = { digestMode: 'daily', digestHour: 7 };
    zone = { timeZone: 'Europe/London', detected: 'America/Chicago' };
  });

  it('shows the stored hour and the zone it is read in', () => {
    prefs.digestHour = 9;
    render(<LeadNotificationPreferences />);
    expect(hourControl()).toHaveTextContent('9am');
    expect(screen.getByText(/Your time: Europe \/ London/)).toBeInTheDocument();
    expect(hourControl()).not.toBeDisabled();
  });

  it('falls back to the device zone before one is saved', () => {
    zone.timeZone = null;
    render(<LeadNotificationPreferences />);
    expect(screen.getByText(/Your time: America \/ Chicago/)).toBeInTheDocument();
    expect(hourControl()).not.toBeDisabled();
  });

  it('is off, and says why, when no zone is known at all', () => {
    zone = { timeZone: null, detected: null };
    render(<LeadNotificationPreferences />);
    expect(hourControl()).toBeDisabled();
    expect(screen.getByText('Set your time zone below to choose the hour.')).toBeInTheDocument();
  });

  it('is hidden while the morning email is off', () => {
    prefs.digestMode = 'off';
    render(<LeadNotificationPreferences />);
    expect(hourControl()).toBeNull();
  });
});

describe('digestHourOf (US-518)', () => {
  it('reads a stored hour from 5 to 10, and the default otherwise', () => {
    expect(digestHourOf({ digest_hour: 5 })).toBe(5);
    expect(digestHourOf({ digest_hour: 10 })).toBe(10);
    expect(digestHourOf({})).toBe(7);
    expect(digestHourOf({ digest_hour: 11 })).toBe(7);
    expect(digestHourOf({ digest_hour: '8' })).toBe(7);
  });
});
