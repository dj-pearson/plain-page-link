/**
 * US-431: the Links page loads its add, edit and upgrade dialogs when they are
 * opened (the US-412 pattern).
 *
 * The add and edit forms put react-hook-form and zod on the route: 54.1 KB
 * gzip beyond the entry and the dashboard layout, now 25.6 KB.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { FORM_STACK, clickWarmed, expectNoValueImports } from '@/test/lazyDialogs';

const { loaded, canAdd } = vi.hoisted(() => ({
  loaded: new Set<string>(),
  canAdd: { value: true },
}));

vi.mock('@/components/modals/AddLinkModal', () => {
  loaded.add('add');
  return {
    AddLinkModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Add link form" /> : null,
  };
});
vi.mock('@/components/modals/EditLinkModal', () => {
  loaded.add('edit');
  return {
    EditLinkModal: ({ open, link }: { open: boolean; link: { title: string } | null }) =>
      open ? <div role="dialog" aria-label={`Edit ${link?.title}`} /> : null,
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
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: null, canAdd: () => canAdd.value }),
}));
vi.mock('@/hooks/useLinks', () => {
  const mutation = { mutateAsync: vi.fn(), isPending: false };
  return {
    useLinks: () => ({
      links: [
        {
          id: 'k-1',
          user_id: 'u1',
          title: 'My site',
          url: 'https://example.com',
          icon: 'link',
          position: 0,
          is_active: true,
          click_count: 0,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      addLink: mutation,
      updateLink: mutation,
      deleteLink: mutation,
      toggleActive: mutation,
      reorderLinks: mutation,
    }),
  };
});

import Links from './Links';

describe('Links dialogs load on first open (US-431)', () => {
  beforeEach(() => {
    canAdd.value = true;
  });

  it('renders the links without loading the add, edit or upgrade dialogs', () => {
    loaded.clear();
    renderWithProviders(<Links />);
    expect(screen.getByText('My site')).toBeInTheDocument();
    expect([...loaded]).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the add form from Add Link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Links />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add Link' }));
    expect(await screen.findByRole('dialog', { name: 'Add link form' })).toBeInTheDocument();
  });

  it('opens the edit form for a link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Links />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Edit link' }));
    expect(await screen.findByRole('dialog', { name: 'Edit My site' })).toBeInTheDocument();
  });

  it('shows the upgrade prompt, not the form, when the plan is full', async () => {
    canAdd.value = false;
    const user = userEvent.setup();
    renderWithProviders(<Links />);
    await clickWarmed(user, screen.getByRole('button', { name: 'Add Link' }));
    expect(await screen.findByRole('dialog', { name: 'Upgrade' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Add link form' })).not.toBeInTheDocument();
  });

  it('does not statically import the dialogs or the form stack', () => {
    expectNoValueImports(join(__dirname, 'Links.tsx'), [
      ...FORM_STACK,
      '@/components/modals/AddLinkModal',
      '@/components/modals/EditLinkModal',
      '@/components/UpgradeModal',
    ]);
  });
});
