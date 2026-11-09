/**
 * US-590: Coming up treated each failed source as "nothing coming up", and with
 * every source failed it rendered nothing, so the agent read a quiet week.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { state } = vi.hoisted(() => ({
  state: {
    dates: {
      keyDates: [] as unknown[],
      isLoading: false,
      error: null as unknown,
      refetch: vi.fn(),
    },
    due: { data: [] as unknown[], isLoading: false, isError: false, refetch: vi.fn() },
    oh: { openHouses: [] as unknown[], isLoading: false, error: null as unknown, refetch: vi.fn() },
  },
}));

vi.mock('@/hooks/useContacts', () => ({
  contactName: (c: { first_name: string; last_name?: string | null }) =>
    [c.first_name, c.last_name].filter(Boolean).join(' '),
  useKeyDates: () => state.dates,
  useContactsDueForTouch: () => state.due,
}));
vi.mock('@/hooks/useOpenHouses', () => ({
  useOpenHouses: () => state.oh,
  formatOpenHouseAddress: () => '1 Main St',
}));

import { ComingUp } from './ComingUp';

beforeEach(() => {
  state.dates = { keyDates: [], isLoading: false, error: null, refetch: vi.fn() };
  state.due = { data: [], isLoading: false, isError: false, refetch: vi.fn() };
  state.oh = { openHouses: [], isLoading: false, error: null, refetch: vi.fn() };
});

describe('ComingUp (US-590)', () => {
  it('renders nothing when every source loaded and there is nothing to say', () => {
    const { container } = renderWithProviders(<ComingUp />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names every source that failed and retries only those', async () => {
    state.dates.error = new Error('boom');
    state.oh.error = new Error('boom');
    renderWithProviders(<ComingUp />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your open houses and client dates did not load.'
    );
    await userEvent.click(screen.getByRole('button', { name: /retry loading what is coming up/i }));
    expect(state.dates.refetch).toHaveBeenCalledTimes(1);
    expect(state.oh.refetch).toHaveBeenCalledTimes(1);
    expect(state.due.refetch).not.toHaveBeenCalled();
  });

  it('keeps what did load alongside the failure', () => {
    state.due = {
      data: [{ id: 'c1', first_name: 'Ada', last_name: 'Lovelace', last_contacted_at: null }],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
    state.dates.error = new Error('boom');
    renderWithProviders(<ComingUp />);

    expect(screen.getByRole('alert')).toHaveTextContent('Your client dates did not load.');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });
});
