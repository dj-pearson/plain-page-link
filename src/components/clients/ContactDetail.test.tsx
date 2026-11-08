/**
 * US-612: a failed read inside the client detail is not an empty one. "No
 * dates yet" invited re-entering a birthday that was already saved, and
 * "Nothing logged yet" hid the touch history.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import type { Contact } from '@/hooks/useContacts';

const { state } = vi.hoisted(() => ({
  state: {
    keyDatesError: false,
    interactionsError: false,
    refetchKeyDates: vi.fn(),
    refetchInteractions: vi.fn(),
  },
}));

const contact: Contact = {
  id: 'c-1',
  user_id: 'u-1',
  lead_id: null,
  first_name: 'Jordan',
  last_name: 'Reyes',
  email: null,
  phone: null,
  relationship: 'past_client',
  preferred_contact: null,
  address: null,
  city: null,
  state: null,
  zip_code: null,
  occupation: null,
  employer: null,
  referred_by: null,
  source: null,
  household: [],
  interests: [],
  tags: [],
  notes: null,
  touch_frequency_days: null,
  last_contacted_at: null,
  next_touch_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

vi.mock('@/hooks/useContacts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useContacts')>('@/hooks/useContacts');
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    ...actual,
    useContacts: () => ({ deleteContact: mutation }),
    useContact: () => ({ data: contact, isLoading: false, error: null }),
    useKeyDates: () => ({
      keyDates: [],
      isLoading: false,
      isError: state.keyDatesError,
      refetch: state.refetchKeyDates,
      addKeyDate: mutation,
      updateKeyDate: mutation,
      deleteKeyDate: mutation,
    }),
    useContactInteractions: () => ({
      interactions: [],
      isLoading: false,
      isError: state.interactionsError,
      refetch: state.refetchInteractions,
      logInteraction: mutation,
      deleteInteraction: mutation,
    }),
  };
});

import { ContactDetail } from './ContactDetail';

const renderDetail = () =>
  renderWithProviders(<ContactDetail contactId="c-1" open onOpenChange={vi.fn()} />);

describe('ContactDetail failed loads (US-612)', () => {
  beforeEach(() => {
    state.keyDatesError = false;
    state.interactionsError = false;
    state.refetchKeyDates.mockClear();
    state.refetchInteractions.mockClear();
  });

  it('shows the empty key-dates prompt when the read succeeded with nothing', () => {
    renderDetail();
    expect(screen.getByText(/No dates yet/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('says the key dates did not load, with a retry, instead of "No dates yet"', async () => {
    state.keyDatesError = true;
    renderDetail();
    expect(screen.getByRole('alert')).toHaveTextContent("This client's key dates did not load.");
    expect(screen.queryByText(/No dates yet/)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Retry loading key dates' }));
    expect(state.refetchKeyDates).toHaveBeenCalledTimes(1);
  });

  it('says the activity did not load, with a retry, instead of "Nothing logged yet"', async () => {
    state.interactionsError = true;
    renderDetail();
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByRole('alert')).toHaveTextContent("This client's activity did not load.");
    expect(screen.queryByText('Nothing logged yet.')).toBeNull();
    // Logging a new touch still works while the history is unavailable.
    expect(screen.getByRole('form', { name: 'Log an interaction' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry loading activity' }));
    expect(state.refetchInteractions).toHaveBeenCalledTimes(1);
  });
});
