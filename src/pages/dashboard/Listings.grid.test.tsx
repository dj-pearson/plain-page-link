/**
 * US-257: the grid card's Edit/Delete were `opacity-0 group-hover:opacity-100`
 * with only a `title` — invisible on a phone (no hover) and to a keyboard user
 * tabbing onto them, and unnamed to a screen reader. The grid/list toggles and
 * the Add menu chevron were unnamed icon buttons; there was no loading state,
 * so a slow load looked like "No properties yet"; and drag was the only way to
 * reorder.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const { state, reorderMutate, views } = vi.hoisted(() => ({
  state: { listings: [] as unknown[], isLoading: false },
  reorderMutate: vi.fn(),
  views: {
    isReady: true,
    stats: {} as Record<
      string,
      { views7d: number; views30d: number; visitors30d: number; lastViewedAt: string | null }
    >,
  },
}));

vi.mock('@/hooks/useListingViewStats', () => ({
  useListingViewStats: () => ({
    stats: views.stats,
    isReady: views.isReady,
    isLoading: false,
    isError: !views.isReady,
  }),
}));

vi.mock('@/hooks/useListings', () => ({
  useListings: () => ({
    listings: state.listings,
    isLoading: state.isLoading,
    isError: false,
    error: null,
    refetch: vi.fn(),
    addListing: { mutateAsync: vi.fn() },
    updateListing: { mutateAsync: vi.fn() },
    deleteListing: { mutateAsync: vi.fn() },
    reorderListings: { mutateAsync: reorderMutate },
  }),
}));
vi.mock('@/hooks/useListingImageUpload', () => ({
  useListingImageUpload: () => ({ uploadListingImages: vi.fn(), uploading: false, progress: 0 }),
}));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: null, canAdd: () => true }),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));
vi.mock('@/components/dashboard/QuickStatusUpdate', () => ({ QuickStatusUpdate: () => null }));

import Listings from './Listings';

const listing = (id: string, address: string, sort_order: number) => ({
  id,
  user_id: 'u1',
  address,
  city: 'Springfield',
  price: '450000',
  bedrooms: 3,
  bathrooms: 2,
  status: 'active',
  photos: null,
  image: null,
  sort_order,
  created_at: '2026-01-01T00:00:00Z',
});

describe('Listings grid (US-257)', () => {
  beforeEach(() => {
    reorderMutate.mockReset().mockResolvedValue(undefined);
    state.isLoading = false;
    views.isReady = true;
    views.stats = {};
    state.listings = [
      listing('a', '1 First St', 0),
      listing('b', '2 Second St', 1),
      listing('c', '3 Third St', 2),
    ];
  });

  it('names the card actions and keeps them visible on touch and on focus', () => {
    renderWithProviders(<Listings />);
    const edit = screen.getByRole('button', { name: 'Edit 1 First St' });
    expect(screen.getByRole('button', { name: 'Delete 1 First St' })).toBeInTheDocument();
    const bar = edit.parentElement as HTMLElement;
    expect(bar.className).toContain('group-focus-within:opacity-100');
    expect(bar.className).toContain('[@media(hover:none)]:opacity-100');
  });

  it('names the view toggles with aria-pressed and the Add chevron with aria-expanded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    const grid = screen.getByRole('button', { name: 'Grid view' });
    const list = screen.getByRole('button', { name: 'List view' });
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    expect(list).toHaveAttribute('aria-pressed', 'false');
    await user.click(list);
    expect(list).toHaveAttribute('aria-pressed', 'true');

    const chevron = screen.getByRole('button', { name: 'More ways to add a property' });
    expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await user.click(chevron);
    expect(chevron).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows a loading skeleton, not the empty state, while loading', () => {
    state.isLoading = true;
    state.listings = [];
    renderWithProviders(<Listings />);
    expect(screen.getByRole('status', { name: 'Loading listings' })).toBeInTheDocument();
    expect(screen.queryByText('No properties yet')).not.toBeInTheDocument();
  });

  it('moves a listing later and earlier without drag', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);

    expect(screen.getByRole('button', { name: 'Move 1 First St earlier' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move 3 Third St later' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Move 1 First St later' }));
    // One write of only the rows that moved, through US-253's reorder mutation.
    expect(reorderMutate).toHaveBeenCalledTimes(1);
    expect(reorderMutate).toHaveBeenCalledWith([
      { id: 'b', sort_order: 0 },
      { id: 'a', sort_order: 1 },
    ]);

    reorderMutate.mockClear();
    await user.click(screen.getByRole('button', { name: 'Move 3 Third St earlier' }));
    expect(reorderMutate).toHaveBeenCalledWith([
      { id: 'c', sort_order: 1 },
      { id: 'b', sort_order: 2 },
    ]);
  });

  // US-263: listing_view events were recorded and never shown.
  describe('views per listing', () => {
    it('shows each card its 30-day views and this week, and says so when there are none', () => {
      views.stats = {
        a: { views7d: 4, views30d: 31, visitors30d: 20, lastViewedAt: null },
      };
      renderWithProviders(<Listings />);
      expect(
        screen.getByText('31 views by 20 visitors in the last 30 days; 4 views in the last 7 days')
      ).toBeInTheDocument();
      expect(screen.getByText('31 views · 4 this week')).toBeInTheDocument();
      // b and c were never opened by a visitor.
      expect(screen.getAllByText('No views in 30 days')).toHaveLength(2);
    });

    it('shows no views line at all when the counts could not be loaded', () => {
      views.isReady = false;
      renderWithProviders(<Listings />);
      expect(screen.queryByText('No views in 30 days')).not.toBeInTheDocument();
    });

    it('adds a Views (30d) column to the list view', async () => {
      const user = userEvent.setup();
      views.stats = { b: { views7d: 0, views30d: 1500, visitors30d: 700, lastViewedAt: null } };
      renderWithProviders(<Listings />);
      await user.click(screen.getByRole('button', { name: 'List view' }));
      expect(screen.getByRole('columnheader', { name: 'Views (30d)' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '1,500' })).toBeInTheDocument();
    });
  });
});
