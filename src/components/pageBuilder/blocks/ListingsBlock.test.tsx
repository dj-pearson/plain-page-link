/**
 * US-260: the page builder's listings block served each listing's original
 * upload (often several megabytes) eagerly, and a listing without photos got a
 * hot-linked Unsplash stock photo of someone else's house.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
];

vi.mock('@/integrations/supabase/client', () => {
  const query = {
    select: () => query,
    eq: () => query,
    order: () => query,
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

import { ListingsBlock } from './ListingsBlock';

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
