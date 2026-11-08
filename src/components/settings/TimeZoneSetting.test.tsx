import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mutate = vi.fn();
let hookState: { timeZone: string | null; detected: string | null; isLoading: boolean };

vi.mock('@/hooks/useAgentTimeZone', () => ({
  useAgentTimeZone: () => ({
    ...hookState,
    isKnown: !hookState.isLoading,
    update: { mutate, isPending: false },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { TimeZoneSetting } from './TimeZoneSetting';

describe('TimeZoneSetting (US-433)', () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it('offers the device zone until one is saved, and saves it on request', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isLoading: false };
    render(<TimeZoneSetting />);
    expect(screen.getByRole('status')).toHaveTextContent(/Not saved yet/);
    expect(screen.getByRole('combobox')).toHaveTextContent('America / Chicago');
    fireEvent.click(screen.getByRole('button', { name: 'Use this time zone' }));
    expect(mutate).toHaveBeenCalledWith('America/Chicago', expect.any(Object));
  });

  it('shows the saved zone with no prompt', () => {
    hookState = { timeZone: 'Europe/London', detected: 'America/Chicago', isLoading: false };
    render(<TimeZoneSetting />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Europe / London');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use this time zone' })).toBeNull();
  });
});
