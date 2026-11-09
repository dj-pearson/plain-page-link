/**
 * US-431: the Clients page loads its add form, contact detail and upgrade
 * prompt when they are opened (the US-412 pattern).
 *
 * The form (and the detail, which embeds it for editing) put react-hook-form
 * and zod on the route: 54.4 KB gzip beyond the entry and the dashboard layout,
 * now 20.3 KB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { FORM_STACK, clickWarmed, expectNoValueImports } from '@/test/lazyDialogs';

const { loaded, canAdd } = vi.hoisted(() => ({
  loaded: new Set<string>(),
  canAdd: { value: true },
}));

vi.mock('@/components/clients/ContactFormDialog', () => {
  loaded.add('form');
  return {
    HOUSEHOLD_RELATIONS: [],
    ContactFormDialog: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Add client form" /> : null,
  };
});
vi.mock('@/components/clients/ContactDetail', () => {
  loaded.add('detail');
  return {
    ContactDetail: ({ contactId }: { contactId: string }) => (
      <div role="dialog" aria-label={`Client ${contactId}`} />
    ),
  };
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
  usePlanUsage: () => ({ canAdd: () => canAdd.value, planName: 'Free' }),
}));
vi.mock('@/hooks/useContacts', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useContacts')>('@/hooks/useContacts');
  return {
    ...actual,
    useContacts: () => ({
      contacts: [
        {
          id: 'c-1',
          lead_id: null,
          first_name: 'Jordan',
          last_name: 'Reyes',
          relationship: 'past_client',
          preferred_contact: null,
          city: null,
          household: [],
          interests: [],
          tags: [],
          touch_frequency_days: null,
          last_contacted_at: null,
          next_touch_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
  };
});

import Clients from './Clients';

describe('Clients dialogs load on first open (US-431)', () => {
  beforeEach(() => {
    canAdd.value = true;
    window.history.pushState({}, '', '/');
  });

  it('renders the list without loading the form, the detail or the upgrade prompt', () => {
    loaded.clear();
    renderWithProviders(<Clients />);
    expect(screen.getByText('Jordan Reyes')).toBeInTheDocument();
    expect([...loaded]).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the add form from Add client', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Clients />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add client' }));
    expect(await screen.findByRole('dialog', { name: 'Add client form' })).toBeInTheDocument();
  });

  it('opens a contact when its row is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Clients />);
    await clickWarmed(user, screen.getByRole('button', { name: /Jordan Reyes/ }));
    expect(await screen.findByRole('dialog', { name: 'Client c-1' })).toBeInTheDocument();
  });

  it('shows the upgrade prompt, not the form, when the plan is full', async () => {
    canAdd.value = false;
    const user = userEvent.setup();
    renderWithProviders(<Clients />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add client' }));
    expect(await screen.findByRole('dialog', { name: 'Upgrade' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add client form' })).not.toBeInTheDocument();
  });

  it('does not statically import the dialogs or the form stack', () => {
    expectNoValueImports(join(__dirname, 'Clients.tsx'), [
      ...FORM_STACK,
      '@/components/clients/ContactFormDialog',
      '@/components/clients/ContactDetail',
      '@/components/UpgradeModal',
    ]);
  });
});
