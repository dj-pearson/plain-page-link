/**
 * US-628: the schedule form reads and writes times in the agent's saved time
 * zone, not the browser's, and refuses a start that has already passed.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import type { OpenHouse } from '@/hooks/useOpenHouses';

const { createMutate, updateMutate, zone } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  zone: { timeZone: 'America/Chicago' as string | null, detected: 'Asia/Tokyo' as string | null },
}));

vi.mock('@/hooks/useAgentTimeZone', () => ({
  useAgentTimeZone: () => ({ ...zone, isLoading: false, isKnown: true }),
}));
vi.mock('@/hooks/usePlanUsage', () => ({ usePlanUsage: () => ({ planName: 'Free' }) }));
vi.mock('@/hooks/useListings', () => ({
  useListings: () => ({
    listings: [{ id: 'l-1', address: '1 First St', city: 'Springfield', status: 'active' }],
    isLoading: false,
  }),
}));
vi.mock('@/hooks/useOpenHouses', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/useOpenHouses')>('@/hooks/useOpenHouses');
  return {
    ...actual,
    useOpenHouses: () => ({
      createOpenHouse: { mutateAsync: createMutate },
      updateOpenHouse: { mutateAsync: updateMutate },
    }),
  };
});

import { OpenHouseFormDialog } from './OpenHouseFormDialog';

const setValue = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('OpenHouseFormDialog time zone (US-628)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // Sunday 2026-11-08, 18:00 UTC = noon in Chicago.
    vi.setSystemTime(new Date('2026-11-08T18:00:00Z'));
    createMutate.mockReset().mockResolvedValue({});
    updateMutate.mockReset().mockResolvedValue({});
    zone.timeZone = 'America/Chicago';
    zone.detected = 'Asia/Tokyo';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the wall time as an instant in the saved zone', async () => {
    renderWithProviders(<OpenHouseFormDialog open onOpenChange={vi.fn()} defaultListingId="l-1" />);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-14');
    expect(screen.getByText(/Times are in America \/ Chicago/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate.mock.calls[0][0]).toMatchObject({
      listing_id: 'l-1',
      starts_at: '2026-11-14T19:00:00.000Z',
      ends_at: '2026-11-14T21:00:00.000Z',
    });
  });

  it('falls back to the device zone and says so when none is saved', () => {
    zone.timeZone = null;
    renderWithProviders(<OpenHouseFormDialog open onOpenChange={vi.fn()} defaultListingId="l-1" />);
    expect(screen.getByText(/this device's time zone, Asia \/ Tokyo/)).toBeInTheDocument();
  });

  it('refuses a start that has already passed', async () => {
    renderWithProviders(<OpenHouseFormDialog open onOpenChange={vi.fn()} defaultListingId="l-1" />);
    setValue('Date', '2026-11-07');

    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    expect(await screen.findByText(/start time has already passed/)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Starts')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an existing open house in the saved zone and lets a past one be edited', async () => {
    const past: OpenHouse = {
      id: 'oh-1',
      listing_id: 'l-1',
      starts_at: '2026-11-01T19:00:00+00:00',
      ends_at: '2026-11-01T21:00:00+00:00',
      is_public: true,
      public_notes: null,
      private_notes: null,
    } as unknown as OpenHouse;
    renderWithProviders(<OpenHouseFormDialog open onOpenChange={vi.fn()} openHouse={past} />);

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-01');
    expect(screen.getByLabelText('Starts')).toHaveValue('13:00');
    expect(screen.getByLabelText('Ends')).toHaveValue('15:00');

    await userEvent.type(screen.getByLabelText('Private notes'), 'Lockbox 1234');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0].input).toMatchObject({
      starts_at: '2026-11-01T19:00:00.000Z',
      private_notes: 'Lockbox 1234',
    });
  });
});
