/**
 * US-260: the page builder's listings block served each listing's original
 * upload (often several megabytes) eagerly, and a listing without photos got a
 * hot-linked Unsplash stock photo of someone else's house.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ListingsBlockConfig } from '@/types/pageBuilder';

const STORAGE = 'https://db.example.com/storage/v1/object/public/listing-photos';
const rows = [
  {
    id: 'l1',
    address: '1 Oak St',
    city: 'Provo',
    state: 'UT',
    price: '400000',
    status: 'active',
    photos: [`${STORAGE}/u/l1/abc.jpg`],
    image: null,
  },
  {
    id: 'l2',
    address: '2 Pine St',
    city: 'Provo',
    state: 'UT',
    price: '500000',
    status: 'active',
    photos: [],
    image: null,
  },
  {
    id: 'l3',
    address: '3 Elm St',
    city: 'Provo',
    state: null,
    price: '600000',
    status: 'sold',
    bedrooms: 0,
    bathrooms: 2,
    square_feet: null,
    photos: [],
    image: null,
  },
];

const selected = vi.hoisted(() => ({
  columns: [] as string[],
  orders: [] as Array<[string, { ascending?: boolean } | undefined]>,
}));

vi.mock('@/integrations/supabase/client', () => {
  const query = {
    select: (cols: string) => {
      selected.columns.push(cols);
      return query;
    },
    eq: () => query,
    order: (column: string, opts?: { ascending?: boolean }) => {
      selected.orders.push([column, opts]);
      return query;
    },
    limit: () => query,
    then: (resolve: (v: { data: typeof rows; error: null }) => unknown) =>
      resolve({ data: rows, error: null }),
  };
  return {
    supabase: {
      from: () => query,
      storage: {
        from: (bucket: string) => ({
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://db.example.com/storage/v1/object/public/${bucket}/${path}`,
            },
          }),
        }),
      },
    },
  };
});

import { ListingsBlock, listingsBlockAddress } from './ListingsBlock';
import { LISTINGS_BLOCK_COLUMNS } from '@/lib/listingColumns';

const config = {
  type: 'listings',
  title: 'Homes',
  layout: 'grid',
  filter: 'all',
  showPrices: true,
  showStatus: false,
} as unknown as ListingsBlockConfig;

describe('ListingsBlock photos (US-260)', () => {
  it('serves resized variants lazily, and the placeholder rather than a stock photo', async () => {
    render(<ListingsBlock config={config} userId="agent-1" />);

    const withPhoto = await screen.findByRole('img', { name: '1 Oak St, Provo, UT' });
    expect(withPhoto).toHaveAttribute('src', `${STORAGE}/u/l1/abc-800.webp`);
    expect(withPhoto.getAttribute('srcset')).toContain(`${STORAGE}/u/l1/abc-400.webp 400w`);
    expect(withPhoto).toHaveAttribute('loading', 'lazy');

    const without = screen.getByRole('img', { name: '2 Pine St, Provo, UT' });
    expect(without).toHaveAttribute('src', '/placeholder-property.svg');
    for (const img of screen.getAllByRole('img')) {
      expect(img.getAttribute('src')).not.toContain('unsplash');
    }
  });
});

describe('ListingsBlock columns (US-342)', () => {
  it('selects the named card columns, not the whole row', async () => {
    selected.columns.length = 0;
    render(<ListingsBlock config={config} userId="agent-1" />);
    await screen.findByRole('img', { name: '1 Oak St, Provo, UT' });
    expect(selected.columns).toEqual([LISTINGS_BLOCK_COLUMNS]);
  });
});

/**
 * US-589: on the agent's public page the block's cards wore cursor-pointer and
 * a hover shadow but linked nowhere, ignored the order the agent arranged, and
 * printed "Provo, null" for a listing without a state.
 */
describe('ListingsBlock on the public page (US-589)', () => {
  const href = (listing: { id: string; status: string | null }) =>
    listing.status === 'sold' ? null : `/jane/listing/${listing.id}`;

  it('links each card the profile would show to its listing page', async () => {
    render(
      <MemoryRouter>
        <ListingsBlock config={config} userId="agent-1" listingHref={href} />
      </MemoryRouter>
    );
    const link = await screen.findByRole('link', { name: /View listing:\s*1 Oak St, Provo, UT/ });
    expect(link).toHaveAttribute('href', '/jane/listing/l1');
    expect(
      screen.getByRole('link', { name: /View listing:\s*2 Pine St, Provo, UT/ })
    ).toHaveAttribute('href', '/jane/listing/l2');
    // A listing whose page would not show it (sold, sold hidden) is not a dead link.
    expect(screen.queryByRole('link', { name: /3 Elm St/ })).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders no links in the page builder canvas', async () => {
    render(
      <MemoryRouter>
        <ListingsBlock config={config} userId="agent-1" listingHref={href} isEditing />
      </MemoryRouter>
    );
    await screen.findByRole('img', { name: '1 Oak St, Provo, UT' });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it("orders by the agent's arrangement, as the profile gallery does", async () => {
    selected.orders.length = 0;
    render(<ListingsBlock config={config} userId="agent-1" />);
    await screen.findByRole('img', { name: '1 Oak St, Provo, UT' });
    expect(selected.orders).toEqual([
      ['sort_order', { ascending: true }],
      ['created_at', { ascending: false }],
      ['id', { ascending: true }],
    ]);
  });

  it('drops missing address parts and zero counts', async () => {
    render(<ListingsBlock config={config} userId="agent-1" />);
    const img = await screen.findByRole('img', { name: '3 Elm St, Provo' });
    expect(document.body.textContent).not.toContain('null');
    const card = img.closest('div.relative.bg-white') as HTMLElement;
    expect(within(card).getByText('2 ba')).toBeInTheDocument();
    expect(within(card).queryByText(/bd/)).toBeNull();
    expect(card.textContent).not.toMatch(/(^|\D)0 /);
  });

  it('builds the address from whichever parts exist', () => {
    expect(listingsBlockAddress({ address: '1 Oak St', city: 'Provo', state: 'UT' })).toBe(
      '1 Oak St, Provo, UT'
    );
    expect(listingsBlockAddress({ address: '1 Oak St', city: ' ', state: null })).toBe('1 Oak St');
  });
});
