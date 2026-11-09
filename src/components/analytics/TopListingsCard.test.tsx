/**
 * US-325: "Top listings" on the Analytics page. Loading, failure and an empty
 * range must stay distinct — a failed query reading as "no views" would tell
 * the agent nobody looks at their listings.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import { TopListingsCard } from './TopListingsCard';
import type { TopListing } from '@/lib/listingViews';

const listing = (overrides: Partial<TopListing>): TopListing => ({
  listingId: 'a',
  address: '1 Main St',
  city: 'Austin',
  status: 'active',
  views: 10,
  visitors: 8,
  lastViewedAt: null,
  ...overrides,
});

const base = {
  listings: [] as TopListing[],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  rangeLabel: 'the last 30 days',
};

describe('TopListingsCard (US-325)', () => {
  it('lists listings in the order given, with counts and a status for sold ones', () => {
    renderWithProviders(
      <TopListingsCard
        {...base}
        listings={[
          listing({ listingId: 'a', address: '1 Main St', views: 12, visitors: 9 }),
          listing({ listingId: 'b', address: '2 Oak Ave', status: 'sold', views: 1, visitors: 1 }),
        ]}
      />
    );
    const list = screen.getByRole('list', { name: 'Most viewed listings in the last 30 days' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('1 Main St');
    expect(items[0]).toHaveTextContent('12 views · 9 visitors');
    expect(items[1]).toHaveTextContent('2 Oak Ave');
    expect(items[1]).toHaveTextContent('Austin · Sold');
    expect(items[1]).toHaveTextContent('1 view · 1 visitor');
  });

  it('shows an empty state naming the range, with a way to Listings', () => {
    renderWithProviders(<TopListingsCard {...base} rangeLabel="the last 7 days" />);
    expect(screen.getByText('No visitor opened a listing in the last 7 days.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Listings' })).toHaveAttribute(
      'href',
      '/dashboard/listings'
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading, not the empty state', () => {
    renderWithProviders(<TopListingsCard {...base} isLoading />);
    expect(screen.getByLabelText('Loading top listings')).toBeInTheDocument();
    expect(screen.queryByText(/No visitor opened/)).not.toBeInTheDocument();
  });

  it('on failure says so and retries, never claiming zero views', async () => {
    const onRetry = vi.fn();
    renderWithProviders(<TopListingsCard {...base} isError onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Listing views could not be loaded.');
    expect(screen.queryByText(/No visitor opened/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
