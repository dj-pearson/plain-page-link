/**
 * US-431: the Open houses page loads its schedule form, visitors list and
 * upgrade prompt when they are opened (the US-412 pattern).
 *
 * The schedule form put react-hook-form and zod on the route: 58.5 KB gzip
 * beyond the entry and the dashboard layout, now 27.9 KB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { FORM_STACK, clickWarmed, expectNoValueImports } from '@/test/lazyDialogs';

const { loaded, locked } = vi.hoisted(() => ({
  loaded: new Set<string>(),
  locked: { value: false },
}));

vi.mock('@/components/openHouses/OpenHouseFormDialog', () => {
  loaded.add('form');
  return {
    OpenHouseFormDialog: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Schedule form" /> : null,
  };
});
vi.mock('@/components/openHouses/OpenHouseVisitorsDialog', () => {
  loaded.add('visitors');
  return { OpenHouseVisitorsDialog: () => null };
});
vi.mock('@/components/UpgradeModal', () => {
  loaded.add('upgrade');
  return {
    UpgradeModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Upgrade" /> : null,
  };
});
vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));
vi.mock('@/hooks/usePlanUsage', () => ({
  usePlanUsage: () => ({
    planName: 'Free',
    status: () => ({ level: locked.value ? 'locked' : 'ok' }),
  }),
}));
vi.mock('@/hooks/useOpenHouses', async () => {
  const actual =
    await vi.importActual<typeof import('@/hooks/useOpenHouses')>('@/hooks/useOpenHouses');
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    ...actual,
    useOpenHouses: () => ({
      openHouses: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      updateOpenHouse: mutation,
      deleteOpenHouse: mutation,
    }),
  };
});
vi.mock('@/hooks/useListings', () => ({
  useListings: () => ({
    listings: [{ id: 'l-1', address: '1 First St', city: 'Springfield', status: 'active' }],
    isLoading: false,
  }),
}));

import OpenHouses from './OpenHouses';

const scheduleButton = () => screen.getByRole('button', { name: 'Schedule open house' });

describe('Open houses dialogs load on first open (US-431)', () => {
  beforeEach(() => {
    locked.value = false;
  });

  it('renders without loading the schedule form, the visitors list or the upgrade prompt', () => {
    loaded.clear();
    renderWithProviders(<OpenHouses />);
    expect(scheduleButton()).toBeEnabled();
    expect([...loaded]).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the schedule form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<OpenHouses />);
    await clickWarmed(user, scheduleButton());
    expect(await screen.findByRole('dialog', { name: 'Schedule form' })).toBeInTheDocument();
  });

  it('shows the upgrade prompt when the plan has no open houses', async () => {
    locked.value = true;
    const user = userEvent.setup();
    renderWithProviders(<OpenHouses />);
    await clickWarmed(user, scheduleButton());
    expect(await screen.findByRole('dialog', { name: 'Upgrade' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Schedule form' })).not.toBeInTheDocument();
  });

  it('does not statically import the dialogs or the form stack', () => {
    expectNoValueImports(join(__dirname, 'OpenHouses.tsx'), [
      ...FORM_STACK,
      '@/components/openHouses/OpenHouseFormDialog',
      '@/components/openHouses/OpenHouseVisitorsDialog',
      '@/components/UpgradeModal',
    ]);
  });
});
