/**
 * US-245: icon-only controls on the public profile had no accessible name.
 * Screen readers announced "button" for the testimonial arrows and the listing
 * photo prev/next/thumbnails; on mobile the Filters and Sort buttons were bare
 * icons (their text was `hidden`, not `sr-only`), and the search box had only
 * a placeholder for a label.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListingGallery from './ListingGallery';
import { TestimonialSection } from './TestimonialSection';
import ListingDetails from './ListingDetails';
import type { PublicProfileListing } from '@/types';
import { LISTING_DETAIL_IMAGE_SIZES, PLACEHOLDER_PROPERTY_IMAGE } from '@/lib/images';
import type { PublicTestimonial } from '@/types/testimonial';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const listing = (id: string, overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id,
    image: null,
    photos: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
    address: `${id} Maple Avenue`,
    city: 'Salt Lake City',
    price: '525000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1980,
    status: 'active',
    sort_order: 1,
    is_featured: false,
    days_on_market: 12,
    description: null,
    property_type: 'condo',
    state: 'UT',
    zip_code: '84103',
    mls_number: null,
    lot_size_acres: null,
    virtual_tour_url: null,
    highlights: [],
    created_at: '2026-03-01T12:00:00.000Z',
    ...overrides,
  }) as unknown as PublicProfileListing;

const testimonial = (n: number) =>
  ({
    id: `t${n}`,
    client_name: `Client ${n}`,
    client_photo: null,
    rating: 5,
    review: `Review number ${n} was great.`,
    property_type: 'Condo',
    transaction_type: 'buyer',
    date: '2026-01-01',
    is_featured: false,
    sort_order: n,
  }) as unknown as PublicTestimonial;

describe('ListingGallery controls (US-245)', () => {
  it('labels the search box', () => {
    render(<ListingGallery listings={[listing('1')]} />);
    expect(screen.getByRole('searchbox', { name: 'Search properties' })).toBeInTheDocument();
  });

  it('names the filter and sort toggles and reports whether they are expanded', async () => {
    const user = userEvent.setup();
    render(<ListingGallery listings={[listing('1')]} />);

    const filters = screen.getByRole('button', { name: 'Filters' });
    const sort = screen.getByRole('button', { name: 'Sort: Newest First' });
    expect(filters).toHaveAttribute('aria-expanded', 'false');
    expect(sort).toHaveAttribute('aria-expanded', 'false');

    await user.click(filters);
    expect(filters).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('group', { name: 'Minimum Bedrooms' });
    expect(group).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2+', pressed: false }));
    expect(screen.getByRole('button', { name: '2+' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();

    await user.click(sort);
    expect(sort).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(sort).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the button names on mobile, where the visible text is sr-only rather than hidden', () => {
    render(<ListingGallery listings={[listing('1')]} />);
    const filters = screen.getByRole('button', { name: 'Filters' });
    // `hidden` is display:none and removes the name; `sr-only` keeps it.
    expect(filters.querySelector('.hidden')).toBeNull();
  });
});

describe('TestimonialSection arrows (US-245)', () => {
  it('names the previous/next arrows', () => {
    render(<TestimonialSection testimonials={[1, 2, 3, 4].map(testimonial)} />);
    expect(screen.getByRole('button', { name: 'Previous testimonials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next testimonials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous testimonial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next testimonial' })).toBeInTheDocument();
  });
});

describe('ListingDetails photo controls (US-245)', () => {
  it('names prev/next and the thumbnails, and marks the current thumbnail', async () => {
    const user = userEvent.setup();
    render(<ListingDetails listing={listing('1')} />);

    expect(await screen.findByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    const thumb1 = screen.getByRole('button', { name: 'Show photo 1 of 3' });
    expect(thumb1).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('button', { name: 'Show photo 2 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(thumb1).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Show photo 3 of 3' }));
    expect(screen.getByRole('button', { name: 'Show photo 3 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('ListingDetails on a page (US-275)', () => {
  it('pages through photos with the arrow keys only while the gallery has focus', async () => {
    const user = userEvent.setup();
    render(<ListingDetails listing={listing('1')} />);

    // Not a window-wide listener: arrows pressed elsewhere leave the photo alone.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    const gallery = screen.getByRole('group', { name: 'Photos of 1 Maple Avenue' });
    gallery.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('makes the address the page heading and offers a showing on an available home', async () => {
    const user = userEvent.setup();
    const onRequestShowing = vi.fn();
    render(<ListingDetails listing={listing('1')} onRequestShowing={onRequestShowing} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /1 Maple Avenue, Salt Lake City, UT 84103/ })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Request a Showing' }));
    expect(onRequestShowing).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('offers no showing on a sold home', () => {
    render(
      <ListingDetails listing={listing('1', { status: 'sold' })} onRequestShowing={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: /Showing/ })).not.toBeInTheDocument();
  });
});

describe('ListingDetails photo weight (US-613)', () => {
  const STORE = 'https://db.example.com/storage/v1/object/public/listing-photos/u1/l1';
  const stored = (n: number) => `${STORE}/p${n}.jpg`;

  it('serves the large photo from the WebP variants, never the original, with high priority first', async () => {
    const user = userEvent.setup();
    render(<ListingDetails listing={listing('1', { photos: [stored(1), stored(2)] })} />);

    const main = screen.getByRole('img', { name: '1 Maple Avenue - Photo 1' });
    expect(main).toHaveAttribute('src', `${STORE}/p1-800.webp`);
    expect(main.getAttribute('srcset')).toBe(
      `${STORE}/p1-200.webp 200w, ${STORE}/p1-400.webp 400w, ${STORE}/p1-800.webp 800w`
    );
    expect(main).toHaveAttribute('sizes', LISTING_DETAIL_IMAGE_SIZES);
    expect(main).toHaveAttribute('fetchpriority', 'high');

    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    const second = await screen.findByRole('img', { name: '1 Maple Avenue - Photo 2' });
    expect(second).toHaveAttribute('src', `${STORE}/p2-800.webp`);
    expect(second).not.toHaveAttribute('fetchpriority');
  });

  it('falls back to the original when the variant is missing, then to the placeholder', () => {
    render(<ListingDetails listing={listing('1', { photos: [stored(1)] })} />);
    const main = screen.getByRole('img', { name: '1 Maple Avenue - Photo 1' });

    main.dispatchEvent(new Event('error'));
    expect(main).toHaveAttribute('src', stored(1));
    expect(main).not.toHaveAttribute('srcset');

    main.dispatchEvent(new Event('error'));
    expect(main).toHaveAttribute('src', PLACEHOLDER_PROPERTY_IMAGE);
  });

  it('uses a hot-linked photo as it is, and the placeholder when there are no photos', () => {
    const { unmount } = render(<ListingDetails listing={listing('1')} />);
    const hotLinked = screen.getByRole('img', { name: '1 Maple Avenue - Photo 1' });
    expect(hotLinked).toHaveAttribute('src', 'https://example.com/1.jpg');
    expect(hotLinked).not.toHaveAttribute('srcset');
    unmount();

    render(<ListingDetails listing={listing('2', { photos: [] })} />);
    expect(screen.getByRole('img', { name: '2 Maple Avenue - Photo 1' })).toHaveAttribute(
      'src',
      PLACEHOLDER_PROPERTY_IMAGE
    );
  });
});
