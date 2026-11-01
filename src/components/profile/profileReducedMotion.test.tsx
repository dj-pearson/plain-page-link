/**
 * US-260: the public profile's framer-motion pieces slid and sprang for
 * visitors whose OS asked for reduced motion. Under useReducedMotion they keep
 * opacity fades at most and drop every transform.
 *
 * framer-motion renders a motion element's `initial` values as inline style on
 * the first render, which is what these read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PublicProfile } from '@/types/profile';
import type { PublicProfileListing } from '@/types';

let reduce = false;
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => reduce,
}));
vi.mock('@/lib/analyticsEvents', () => ({ trackContactTap: vi.fn() }));

import { FeaturedListingsCarousel } from './FeaturedListingsCarousel';
import { StickyActionBar } from './StickyActionBar';

const listing = {
  id: 'a',
  image: null,
  photos: [],
  address: '412 Maple Avenue',
  city: 'Salt Lake City',
  price: '525000',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1980,
  status: 'active',
  is_featured: true,
} as unknown as PublicProfileListing;

const profile = {
  id: 'p1',
  username: 'jane',
  phone: '5555550100',
  email_display: 'jane@example.com',
} as unknown as PublicProfile;

function transformsIn(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('[style]')]
    .map((el) => el.style.transform)
    .filter((t) => t && t !== 'none');
}

beforeEach(() => {
  reduce = false;
});

describe('FeaturedListingsCarousel under reduced motion', () => {
  const renderIt = () =>
    render(
      <MemoryRouter>
        <FeaturedListingsCarousel listings={[listing]} autoRotate={false} />
      </MemoryRouter>
    );

  it('slides and lifts in by default', () => {
    const { container } = renderIt();
    expect(transformsIn(container).length).toBeGreaterThan(0);
  });

  it('draws no transforms when the visitor prefers reduced motion', () => {
    reduce = true;
    const { container } = renderIt();
    expect(transformsIn(container)).toEqual([]);
  });
});

describe('StickyActionBar under reduced motion', () => {
  it('slides the desktop card in by default', () => {
    const { container } = render(<StickyActionBar profile={profile} />);
    expect(transformsIn(container).some((t) => t.includes('translateX'))).toBe(true);
  });

  it('shows the desktop card in place when the visitor prefers reduced motion', () => {
    reduce = true;
    const { container } = render(<StickyActionBar profile={profile} />);
    expect(transformsIn(container).filter((t) => t.includes('translate'))).toEqual([]);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
