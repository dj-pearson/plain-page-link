/**
 * US-112: three defects in one component.
 *
 * "View All {n} Sold Properties" had no onClick — a button that named a number
 * and did nothing. Every sold listing counted toward the volume figures
 * including those with no price, so an agent whose listings had no price
 * recorded saw "$0K+". And the summary bar restated the properties-sold and
 * volume numbers that SocialProofBanner already shows on the same page.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import SoldProperties from './SoldProperties';
import type { PublicProfileListing } from '@/types';

vi.mock('./ListingCard', () => ({
  default: ({ listing }: { listing: { address: string } }) => <div>{listing.address}</div>,
}));

const sold = (n: number, price = '500000') =>
  Array.from({ length: n }, (_, i) => ({
    id: `l${i}`,
    address: `${i} Sold Street`,
    city: 'Town',
    price,
    status: 'sold',
    photos: [],
  })) as unknown as PublicProfileListing[];

describe('SoldProperties', () => {
  it('renders nothing when the agent has no sold listings', () => {
    const { container } = renderWithProviders(<SoldProperties listings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows six listings and offers to expand', async () => {
    renderWithProviders(<SoldProperties listings={sold(9)} />);

    expect(screen.getByText('0 Sold Street')).toBeInTheDocument();
    expect(screen.queryByText('8 Sold Street')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view all 9/i })).toBeInTheDocument();
  });

  it('expands when View All is pressed — the button used to do nothing', async () => {
    renderWithProviders(<SoldProperties listings={sold(9)} />);

    await userEvent.click(screen.getByRole('button', { name: /view all 9/i }));

    expect(screen.getByText('8 Sold Street')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show fewer/i })).toBeInTheDocument();
  });

  it('omits the summary bar by default, since the page shows it already', () => {
    renderWithProviders(<SoldProperties listings={sold(2)} />);
    expect(screen.queryByText('Recent Success Stories')).not.toBeInTheDocument();
  });

  it('shows the summary bar when a caller asks for it', () => {
    renderWithProviders(<SoldProperties listings={sold(2)} showStats />);
    expect(screen.getByText('Recent Success Stories')).toBeInTheDocument();
  });

  it('never renders "$0K+" for listings with no price', () => {
    renderWithProviders(<SoldProperties listings={sold(3, '')} showStats />);

    expect(screen.queryByText(/\$0K/)).not.toBeInTheDocument();
    // The count is still true and still worth showing.
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('reports volume from the priced sales only', () => {
    const mixed = [...sold(2, '500000'), ...sold(1, '')] as PublicProfileListing[];
    renderWithProviders(<SoldProperties listings={mixed} showStats />);

    // Two priced sales at 500k: 1.0M total, 500K average — not 333K, which is
    // what dividing by three would give.
    expect(screen.getByText(/1\.0M\+/)).toBeInTheDocument();
    expect(screen.getByText(/500K/)).toBeInTheDocument();
  });
});
