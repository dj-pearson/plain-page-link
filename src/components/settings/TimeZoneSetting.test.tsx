import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mutate = vi.fn();
const refetch = vi.fn();
let hookState: {
  timeZone: string | null;
  detected: string | null;
  isLoading: boolean;
  isError?: boolean;
};

vi.mock('@/hooks/useAgentTimeZone', () => ({
  useAgentTimeZone: () => ({
    timeZone: hookState.timeZone,
    detected: hookState.detected,
    isLoading: hookState.isLoading,
    isError: hookState.isError ?? false,
    isKnown: !hookState.isLoading && !hookState.isError,
    refetch,
    update: { mutate, isPending: false },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import { TimeZoneSetting } from './TimeZoneSetting';

describe('TimeZoneSetting (US-433)', () => {
  beforeEach(() => {
    mutate.mockClear();
    refetch.mockClear();
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

  it('a failed read says so and offers Retry, not the "Not saved yet" prompt (US-631)', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isLoading: false, isError: true };
    render(<TimeZoneSetting />);
    expect(screen.getByRole('alert')).toHaveTextContent('Your time zone did not load.');
    expect(screen.queryByText(/Not saved yet/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use this time zone' })).toBeNull();
    // The picker would show the device zone as if it were the saved one.
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading your time zone' }));
    expect(refetch).toHaveBeenCalledTimes(1);
    expect(mutate).not.toHaveBeenCalled();
  });

  it('shows no prompt while the read is in flight', () => {
    hookState = { timeZone: null, detected: 'America/Chicago', isLoading: true };
    render(<TimeZoneSetting />);
    expect(screen.queryByText(/Not saved yet/)).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
