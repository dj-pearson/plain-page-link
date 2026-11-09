/**
 * US-412: the Listings dashboard loads its dialogs when they are opened.
 *
 * Statically imported, the add/edit/import/share dialogs put react-hook-form
 * and zod (form-vendor) and their own UIs on the route: 109.7 KB gzip beyond
 * the entry, 71.8 KB beyond the dashboard layout, for an agent who only came to
 * look at their listings.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { loaded, canAdd } = vi.hoisted(() => ({
  loaded: new Set<string>(),
  canAdd: { value: true },
}));

vi.mock('@/components/listings/CSVUploadDialog', () => {
  loaded.add('csv');
  return {
    CSVUploadDialog: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="CSV import" /> : null,
  };
});
vi.mock('@/components/listings/URLImportDialog', () => {
  loaded.add('url');
  return {
    URLImportDialog: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="URL import" /> : null,
  };
});
vi.mock('@/components/modals/EditListingModal', () => {
  loaded.add('edit');
  return {
    EditListingModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div role="dialog" aria-label="Edit listing" /> : null,
  };
});
vi.mock('@/components/listings/SocialShareDialog', () => {
  loaded.add('share');
  return { SocialShareDialog: () => null };
});
vi.mock('@/components/UpgradeModal', () => {
  loaded.add('upgrade');
  return {
    UpgradeModal: ({ open }: { open: boolean }) =>
      open ? <div role="dialog" aria-label="Upgrade" /> : null,
  };
});

vi.mock('@/hooks/useListingViewStats', () => ({
  useListingViewStats: () => ({ stats: {}, isReady: true, isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useListings', () => ({
  useListings: () => ({
    listings: [
      {
        id: 'a',
        user_id: 'u1',
        address: '1 First St',
        city: 'Springfield',
        price: '450000',
        bedrooms: 3,
        bathrooms: 2,
        status: 'active',
        photos: null,
        image: null,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    addListing: { mutateAsync: vi.fn() },
    updateListing: { mutateAsync: vi.fn() },
    deleteListing: { mutateAsync: vi.fn() },
    reorderListings: { mutateAsync: vi.fn() },
  }),
}));
vi.mock('@/hooks/useListingImageUpload', () => ({
  useListingImageUpload: () => ({ uploadListingImages: vi.fn(), uploading: false, progress: 0 }),
}));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: null, canAdd: () => canAdd.value }),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));
vi.mock('@/components/dashboard/QuickStatusUpdate', () => ({ QuickStatusUpdate: () => null }));

import Listings from './Listings';

describe('Listings dialogs load on first open (US-412)', () => {
  beforeEach(() => {
    canAdd.value = true;
  });

  it('renders the page without loading any of the mocked dialogs', () => {
    loaded.clear();
    renderWithProviders(<Listings />);
    expect(screen.getByRole('button', { name: 'Edit 1 First St' })).toBeInTheDocument();
    expect([...loaded]).toEqual([]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the real add dialog from Add Property', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: /Add Property/ }));
    expect(
      await screen.findByRole('dialog', { name: 'Add New Property Listing' })
    ).toBeInTheDocument();
  });

  it('opens the CSV and paste-import dialogs from the Add menu', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: 'More ways to add a property' }));
    await user.click(screen.getByRole('button', { name: /Bulk Import \(CSV\)/ }));
    expect(await screen.findByRole('dialog', { name: 'CSV import' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More ways to add a property' }));
    await user.click(screen.getByRole('button', { name: /Import from Zillow/ }));
    expect(await screen.findByRole('dialog', { name: 'URL import' })).toBeInTheDocument();
  });

  it('opens the edit dialog for a listing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: 'Edit 1 First St' }));
    expect(await screen.findByRole('dialog', { name: 'Edit listing' })).toBeInTheDocument();
  });

  it('opens the upgrade dialog when the plan is full', async () => {
    canAdd.value = false;
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: /Add Property/ }));
    expect(await screen.findByRole('dialog', { name: 'Upgrade' })).toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'Add New Property Listing' })
    ).not.toBeInTheDocument();
  });

  it('does not statically import the dialogs or the form stack', () => {
    const src = readFileSync(join(__dirname, 'Listings.tsx'), 'utf8');
    for (const mod of [
      'react-hook-form',
      'zod',
      '@hookform/resolvers/zod',
      '@/components/modals/AddListingModal',
      '@/components/modals/EditListingModal',
      '@/components/listings/CSVUploadDialog',
      '@/components/listings/URLImportDialog',
      '@/components/listings/SocialShareDialog',
      '@/components/UpgradeModal',
    ]) {
      // `import type` is erased at build time; a value import is not.
      const escaped = mod.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
      expect(src, mod).not.toMatch(new RegExp(`import\\s+(?!type\\b)[^;]*from\\s+'${escaped}'`));
    }
  });
});
